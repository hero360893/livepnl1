import { hmacSha256 } from '../../shared/utils/crypto';
import { Position } from '../../shared/types';

interface Ticker { market: string; last_price: string; change_24_hour: string; }

async function post(url: string, apiKey: string, apiSecret: string) {
  const body = JSON.stringify({ timestamp: Date.now() });
  const sig = await hmacSha256(body, apiSecret);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AUTH-APIKEY': apiKey, 'X-AUTH-SIGNATURE': sig },
    body,
  });
  if (!r.ok) throw new Error('CoinDCX error ' + r.status);
  return r.json();
}

export async function buildCoinDCXPositions(apiKey: string, apiSecret: string): Promise<Position[]> {
  const [balances, tickersRaw, trades] = await Promise.all([
    post('https://api.coindcx.com/exchange/v1/users/balances', apiKey, apiSecret),
    fetch('https://api.coindcx.com/exchange/ticker').then(r => r.json()),
    post('https://api.coindcx.com/exchange/v1/orders/trade_history', apiKey, apiSecret).catch(() => []),
  ]);

  const tickers: Record<string, Ticker> = {};
  for (const t of tickersRaw) tickers[t.market] = t;

  const entry: Record<string, { cost: number; qty: number }> = {};
  for (const t of trades) {
    const coin = (t.symbol || '').replace('INR','');
    if (!entry[coin]) entry[coin] = { cost: 0, qty: 0 };
    if (t.side === 'buy') {
      entry[coin].cost += parseFloat(t.quantity||'0') * parseFloat(t.price||'0');
      entry[coin].qty  += parseFloat(t.quantity||'0');
    }
  }

  const positions: Position[] = [];
  for (const bal of balances) {
    const qty = parseFloat(bal.balance || '0');
    if (qty < 0.000001 || bal.currency_short_name === 'INR') continue;
    const market = bal.currency_short_name + 'INR';
    const ticker = tickers[market];
    if (!ticker) continue;
    const now = parseFloat(ticker.last_price);
    const e = entry[bal.currency_short_name];
    const avg = e && e.qty > 0 ? e.cost / e.qty : 0;
    const hasCost = avg > 0;
    positions.push({
      id: 'cdx_' + market,
      symbol: bal.currency_short_name + '/INR',
      side: 'LONG',
      entryPrice: hasCost ? avg : now,
      currentPrice: now,
      quantity: qty,
      unrealisedPnl: hasCost ? (now - avg) * qty : 0,
      unrealisedPnlPct: hasCost && avg > 0 ? (now - avg) / avg : parseFloat(ticker.change_24_hour||'0') / 100,
      hasCostBasis: hasCost,
      quoteCurrency: 'INR',
      exchange: 'coindcx',
      marketType: 'spot',
      updatedAt: Date.now(),
    });
  }
  return positions;
}

export async function testCoinDCXConnection(apiKey: string, apiSecret: string) {
  try {
    await post('https://api.coindcx.com/exchange/v1/users/balances', apiKey, apiSecret);
    return { ok: true, msg: '✓ Connected to CoinDCX' };
  } catch (e: any) { return { ok: false, msg: e.message }; }
}
