import React, { useEffect, useState, useRef } from 'react';
import { Position } from '../shared/types';
import { formatPnl, formatPrice, pct } from '../shared/utils/format';

export default function PipApp() {
  const [positions, setPositions] = useState<Position[]>([]);
  const prevRef = useRef<Record<string, number>>({});

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_POSITIONS' }, r => { if (r?.positions) setPositions(r.positions); });
    const h = (msg: any) => { if (msg.type === 'POSITIONS_UPDATE') setPositions(msg.payload || []); };
    chrome.runtime.onMessage.addListener(h);
    return () => chrome.runtime.onMessage.removeListener(h);
  }, []);

  const total = positions.reduce((s, p) => s + p.unrealisedPnl, 0);
  const ccy = positions[0]?.quoteCurrency || 'USDT';

  return (
    <div className="widget">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">LivePnL</span>
          <span className="live-badge">LIVE</span>
        </div>
        <span className="status-dot" />
      </div>
      <div className="positions">
        {positions.length === 0
          ? <div className="empty"><span className="empty-icon">📊</span><span>No open positions</span></div>
          : positions.map(p => {
              const prev = prevRef.current[p.id];
              const flash = prev !== undefined ? (p.unrealisedPnl > prev ? ' flash-up' : p.unrealisedPnl < prev ? ' flash-down' : '') : '';
              prevRef.current[p.id] = p.unrealisedPnl;
              return (
                <div key={p.id} className="pos-row">
                  <div className="pos-top">
                    <span className="pos-symbol">
                      {p.symbol}
                      <span className={`badge ${p.side === 'LONG' ? 'long' : 'short'}`}>{p.side}</span>
                    </span>
                    <span className={`pos-pnl ${p.unrealisedPnl >= 0 ? 'up' : 'down'}${flash}`}>
                      {p.hasCostBasis ? formatPnl(p.unrealisedPnl, p.quoteCurrency) : pct(p.unrealisedPnlPct)}
                    </span>
                  </div>
                  <div className="pos-bottom">
                    <span>Entry {p.hasCostBasis ? formatPrice(p.entryPrice, p.quoteCurrency) : '—'}</span>
                    <span>Now {formatPrice(p.currentPrice, p.quoteCurrency)}</span>
                  </div>
                </div>
              );
            })}
      </div>
      <div className="footer">
        <span className="footer-exchange">CoinDCX · Spot</span>
        {positions.length > 0 && <span className={`footer-pnl ${total >= 0 ? 'up' : 'down'}`}>{formatPnl(total, ccy)}</span>}
      </div>
    </div>
  );
}
