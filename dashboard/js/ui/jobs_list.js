/**
 * Jobs List Component
 * Renders job list, skeleton loader, empty states, and handles card actions
 */
import { renderJobCard } from './job_card.js';
import { showScoreModal } from './score_dialog.js';
import { showToast } from './toast_manager.js';
import { icon } from '../../../shared/utils/icons.js';

function setContainsId(set, id) {
  return set.has(id) || set.has(Number(id)) || set.has(String(id));
}

function setDeleteId(set, id) {
  set.delete(id);
  set.delete(Number(id));
  set.delete(String(id));
}

export function renderSkeleton(container, count = 4) {
  container.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'jobs-list';
  list.setAttribute('aria-busy', 'true');
  list.setAttribute('aria-label', 'Đang tải danh sách việc làm...');

  for (let i = 0; i < count; i++) {
    const li = document.createElement('li');
    li.className = 'skeleton-card';
    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="skeleton skeleton--title"></span>
        <span class="skeleton" style="width: 4rem; height: 1.5rem;"></span>
      </div>
      <div style="display: flex; gap: var(--space-3); margin-top: var(--space-2);">
        <span class="skeleton" style="width: 6rem; height: 1rem;"></span>
        <span class="skeleton" style="width: 5rem; height: 1rem;"></span>
        <span class="skeleton" style="width: 4rem; height: 1rem;"></span>
      </div>
      <span class="skeleton" style="width: 90%; height: 0.875rem; margin-top: var(--space-2);"></span>
      <span class="skeleton skeleton--short" style="height: 0.875rem;"></span>
      <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
        <span class="skeleton" style="width: 5rem; height: 1.5rem; border-radius: var(--radius-sm);"></span>
        <span class="skeleton" style="width: 4rem; height: 1.5rem; border-radius: var(--radius-sm);"></span>
      </div>
    `;
    list.appendChild(li);
  }

  container.appendChild(list);
}

export function renderEmptyState(container, { type = 'empty-filter', title, message, actionText, onAction } = {}) {
  container.innerHTML = '';

  let iconName = 'inbox';
  let defaultTitle = 'Không tìm thấy việc làm phù hợp';
  let defaultMsg = 'Không có job nào vượt qua các tiêu chí lọc hiện tại. Thử nới lỏng ngân sách hoặc bổ sung thêm kỹ năng.';

  if (type === 'ready') {
    iconName = 'radar';
    defaultTitle = 'Sẵn sàng tìm kiếm việc làm';
    defaultMsg = 'Tùy chỉnh sàn tuyển dụng và kỹ năng ở thanh bên, sau đó nhấn nút để bắt đầu tìm kiếm việc làm mới nhất.';
  } else if (type === 'saved') {
    iconName = 'star';
    defaultTitle = 'Chưa có job nào được lưu';
    defaultMsg = 'Nhấn vào nút "Lưu job" trên bất kỳ thẻ công việc nào để lưu lại danh sách cần ứng tuyển.';
  } else if (type === 'hidden') {
    iconName = 'eye-off';
    defaultTitle = 'Chưa có job nào bị ẩn';
    defaultMsg = 'Những job bạn nhấn "Ẩn" sẽ tạm thời rời khỏi bảng cấp tin chính và xuất hiện ở đây.';
  } else if (type === 'error') {
    iconName = 'triangle-alert';
    defaultTitle = 'Không thể tải danh sách việc làm';
    defaultMsg = 'Có lỗi xảy ra khi kết nối tới nền tảng tìm việc. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.';
  }

  const stateEl = document.createElement('div');
  stateEl.className = 'state';
  if (type === 'error') stateEl.dataset.tone = 'danger';

  stateEl.innerHTML = `
    <div style="font-size: 2.5rem; color: var(--color-text-muted);">
      ${icon(iconName, 'xl')}
    </div>
    <div class="state__title">${title || defaultTitle}</div>
    <div class="state__desc">${message || defaultMsg}</div>
    ${actionText ? `
      <div class="state__actions">
        <button type="button" class="btn ${type === 'ready' ? 'btn--primary' : 'btn--secondary'}" id="emptyActionBtn">${actionText}</button>
      </div>
    ` : ''}
  `;

  if (actionText && typeof onAction === 'function') {
    stateEl.querySelector('#emptyActionBtn')?.addEventListener('click', onAction);
  }

  container.appendChild(stateEl);
}

/**
 * Renders list of jobs based on evaluations and user settings
 */
export function renderJobsList(
  container,
  evaluations,
  {
    personalStore,
    onStoreChange,
    activeTab = 'all',
    sort = 'score',
    showDiscarded = false,
    limit,
    onLoadMore,
  } = {}
) {
  container.innerHTML = '';

  // 1. Filter evaluations by active tab and discard toggle
  let filtered = evaluations.filter(item => {
    const isStarred = setContainsId(personalStore.starred, item.job.id);
    const isHidden = setContainsId(personalStore.hidden, item.job.id);

    if (activeTab === 'saved') {
      return isStarred;
    }

    if (activeTab === 'hidden') {
      return isHidden;
    }

    // Tab 'all': hide hidden jobs
    if (isHidden) return false;

    // Discarded filter
    if (!showDiscarded && item.status === 'discarded') {
      return false;
    }

    return true;
  });

  // 2. Sort evaluations
  filtered.sort((a, b) => {
    if (sort === 'score') {
      const scoreA = a.score !== null ? a.score : -1;
      const scoreB = b.score !== null ? b.score : -1;
      return scoreB - scoreA;
    }
    if (sort === 'budget') {
      const maxA = a.maxUsd !== null ? a.maxUsd : -1;
      const maxB = b.maxUsd !== null ? b.maxUsd : -1;
      return maxB - maxA;
    }
    if (sort === 'latest') {
      const timeA = a.job.submittedAt || 0;
      const timeB = b.job.submittedAt || 0;
      return timeB - timeA;
    }
    if (sort === 'bids') {
      const bidsA = typeof a.job.bids === 'number' ? a.job.bids : 999;
      const bidsB = typeof b.job.bids === 'number' ? b.job.bids : 999;
      return bidsA - bidsB;
    }
    return 0;
  });

  // 3. Render empty states if no items match
  if (filtered.length === 0) {
    renderEmptyState(container, { type: activeTab });
    return;
  }

  // 4. Render visible job cards list
  const listEl = document.createElement('ul');
  listEl.className = 'jobs-list';
  listEl.id = 'results';

  const visibleItems = typeof limit === 'number' ? filtered.slice(0, limit) : filtered;

  visibleItems.forEach(item => {
    const isStarred = setContainsId(personalStore.starred, item.job.id);
    const isHidden = setContainsId(personalStore.hidden, item.job.id);
    const isViewed = setContainsId(personalStore.viewed, item.job.id);

    const card = renderJobCard(item, isStarred, isHidden, isViewed);
    listEl.appendChild(card);
  });


  // 5. Event delegation for card actions
  listEl.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const card = target.closest('.job');
    if (!card) return;

    const jobId = card.dataset.id;
    const item = evaluations.find(ev => String(ev.job.id) === String(jobId));
    if (!item) return;

    if (action === 'star') {
      const alreadyStarred = setContainsId(personalStore.starred, item.job.id);
      if (alreadyStarred) {
        setDeleteId(personalStore.starred, item.job.id);
        showToast('Đã bỏ lưu job khỏi danh sách');
        onStoreChange(true, item.job.id, false);
      } else {
        personalStore.starred.add(item.job.id);
        showToast('Đã lưu job vào danh sách theo dõi');
        onStoreChange(true, item.job.id, true);
      }
    } else if (action === 'hide') {
      const alreadyHidden = setContainsId(personalStore.hidden, item.job.id);
      if (alreadyHidden) {
        setDeleteId(personalStore.hidden, item.job.id);
        showToast('Đã bỏ ẩn job');
      } else {
        personalStore.hidden.add(item.job.id);
        showToast('Đã ẩn job khỏi bảng tin');
      }
      onStoreChange(true, item.job.id, null);
    } else if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(item.job.url);
        showToast('Đã sao chép liên kết job vào clipboard');
      } catch {
        showToast('Không thể sao chép liên kết');
      }
    } else if (action === 'view') {
      personalStore.viewed.add(item.job.id);
      card.dataset.viewed = 'true';
      onStoreChange(false, item.job.id, null); // Don't full re-render on click
    } else if (action === 'score-detail') {
      showScoreModal(item);
    }
  });

  container.appendChild(listEl);

  // 6. Pagination / Load more button
  if (typeof limit === 'number' && filtered.length > visibleItems.length) {
    const moreEl = document.createElement('div');
    moreEl.className = 'more';
    moreEl.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin-top: var(--space-4);';
    moreEl.innerHTML = `
      <p class="caption">Đang hiển thị ${visibleItems.length} trên tổng số ${filtered.length} việc làm</p>
      <button type="button" class="btn btn--secondary" id="btnLoadMore">
        ${icon('chevron-down', 'xs')}
        <span>Xem thêm (${filtered.length - visibleItems.length} việc làm còn lại)</span>
      </button>
    `;
    moreEl.querySelector('#btnLoadMore')?.addEventListener('click', () => {
      if (typeof onLoadMore === 'function') {
        onLoadMore();
      }
    });
    container.appendChild(moreEl);
  }
}

