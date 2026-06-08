import { getSettings, saveSettings, getPositions, setPositions } from './storage';
import { buildCoinDCXPositions, testCoinDCXConnection } from './api/coindcx';
import { buildBinanceFuturesPositions, testBinanceConnection } from './api/binance';
import { AppSettings } from '../shared/types';

chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
  chrome.alarms.create('refresh', { periodInMinutes: 0.1 });
  const s = await getSettings();
  if (!s.installTimestamp) await saveSettings({ ...s, installTimestamp: Date.now() });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'keepAlive') chrome.storage.session.get('ping');
  if (alarm.name === 'refresh') refresh();
});

async function refresh() {
  const s = await getSettings();
  if (!s.apiKey || !s.apiSecret) return;
  try {
    const positions = s.exchange === 'binance'
      ? await buildBinanceFuturesPositions(s.apiKey, s.apiSecret)
      : await buildCoinDCXPositions(s.apiKey, s.apiSecret);
    await setPositions(positions);
    chrome.runtime.sendMessage({ type: 'POSITIONS_UPDATE', payload: positions }).catch(() => {});
  } catch (e) { console.error('[LivePnL]', e); }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_POSITIONS') { getPositions().then(p => sendResponse({ positions: p })); return true; }
  if (msg.type === 'GET_SETTINGS')  { getSettings().then(s => sendResponse({ settings: s })); return true; }
  if (msg.type === 'SAVE_SETTINGS') {
    saveSettings(msg.payload as AppSettings).then(() => { sendResponse({ ok: true }); refresh(); });
    return true;
  }
  if (msg.type === 'TEST_CONNECTION') {
    const { exchange, apiKey, apiSecret } = msg.payload as AppSettings;
    const fn = exchange === 'binance' ? testBinanceConnection(apiKey, apiSecret) : testCoinDCXConnection(apiKey, apiSecret);
    fn.then(r => sendResponse(r));
    return true;
  }
});
