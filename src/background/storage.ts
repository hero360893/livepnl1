import { AppSettings, DEFAULT_SETTINGS } from '../shared/types';
export async function getSettings(): Promise<AppSettings> {
  const r = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(r.settings || {}) };
}
export async function saveSettings(s: AppSettings): Promise<void> {
  await chrome.storage.local.set({ settings: s });
}
export async function getPositions() {
  const r = await chrome.storage.session.get('positions');
  return r.positions || [];
}
export async function setPositions(positions: unknown[]) {
  await chrome.storage.session.set({ positions });
}
