/**
 * Job Source Adapters Registry
 * Central registry mapping platform IDs to their respective adapter instances
 */
import { FreelancerAdapter } from './freelancer_source.js';
import { UpworkAdapter } from './upwork_source.js';
import { WeRemotelyAdapter } from './weremotely_source.js';
import { RemoteOKAdapter } from './remoteok_source.js';
import { JobicyAdapter } from './jobicy_source.js';

const ADAPTER_REGISTRY = {
  freelancer: new FreelancerAdapter(),
  upwork: new UpworkAdapter(),
  weremotely: new WeRemotelyAdapter(),
  remoteok: new RemoteOKAdapter(),
  jobicy: new JobicyAdapter(),
};

/**
 * Get adapter instance by platform ID
 * @param {string} id - Platform identifier
 * @returns {JobSourceAdapter|null}
 */
export function getAdapter(id) {
  return ADAPTER_REGISTRY[id] || null;
}

/**
 * Get all registered adapters
 * @returns {JobSourceAdapter[]}
 */
export function getAllAdapters() {
  return Object.values(ADAPTER_REGISTRY);
}

/**
 * Register a new custom source adapter dynamically
 * @param {JobSourceAdapter} adapter
 */
export function registerAdapter(adapter) {
  if (adapter && adapter.id) {
    ADAPTER_REGISTRY[adapter.id] = adapter;
  }
}
