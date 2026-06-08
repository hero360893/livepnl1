import { hmacSha256 } from '../../shared/utils/crypto';
import { Position } from '../../shared/types';

async function signed(path: string, apiKey: string, apiSecret: string) {
  const q = `timestamp=${Date.now()}`;
  const sig = await hmacSha256(q, apiSecret);
  const r = await fetch(`${path}?${q}&signature=${sig}`, { headers: { 'X-MBX-APIKEY': apiKey } });
  if (!r.ok) throw new Error('Binance error ' + r.status);
  return r.json();
}

export async function buildBinanceFuturesPositions(apiKey: string, apiSecret: string): Promise<Position[]> {
  const raw = await signed('https://fapi.binance.com/fapi/v2/positionRisk', apiKey, apiSecret);
  return raw.filter((p: any) => parseFloat(p.positionAmt) !== 0).map((p: any): Position => {
    const amt = parseFloat(p.positionAmt);
    const entry = parseFloat(p.entryPrice);
    const mark = parseFloat(p.markPrice);
    const pnl = parseFloat(p.unRealizedProfit);
    return {
      id: 'bnb_' + p.symbol,
      symbol: p.symbol.replace('USDT', '/USDT'),
      side: amt > 0 ? 'LONG' : 'SHORT',
      entryPrice: entry, currentPrice: mark, quantity: Math.abs(amt),
      unrealisedPnl: pnl,
      unrealisedPnlPct: entry > 0 ? pnl / (Math.abs(amt) * entry) : 0,
      hasCostBasis: true, quoteCurrency: 'USDT',
      exchange: 'binance', marketType: 'futures', updatedAt: Date.now(),
    };
  });
}

export async function testBinanceConnection(apiKey: string, apiSecret: string) {
  try {
    await signed('https://fapi.binance.com/fapi/v2/positionRisk', apiKey, apiSecret);
    return { ok: true, msg: '✓ Connected to Binance' };
  } catch (e: any) { return { ok: false, msg: e.message }; }
}
