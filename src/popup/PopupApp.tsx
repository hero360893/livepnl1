import React, { useEffect, useState } from 'react';
import { Position } from '../shared/types';
import { formatPnl } from '../shared/utils/format';

export default function PopupApp() {
  const [positions, setPositions] = useState<Position[]>([]);
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_POSITIONS' }, r => { if (r?.positions) setPositions(r.positions); });
  }, []);
  const total = positions.reduce((s, p) => s + p.unrealisedPnl, 0);
  const ccy = positions[0]?.quoteCurrency || 'USDT';
  const openPanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) chrome.sidePanel.open({ tabId: tabs[0].id });
    });
    window.close();
  };
  const live = positions.length > 0;
  return (
    <div style={{ width:290, padding:16, fontFamily:"system-ui,-apple-system,sans-serif", background:'#0d0d12', color:'#f0f0f4' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:16, fontWeight:700, color:'#00e5a0' }}>LivePnL</span>
        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:20, fontWeight:600,
          background: live?'rgba(0,229,160,0.12)':'rgba(255,255,255,0.05)',
          color: live?'#00e5a0':'#555',
          border:`0.5px solid ${live?'rgba(0,229,160,0.25)':'rgba(255,255,255,0.08)'}` }}>
          {live ? '● LIVE' : '○ Offline'}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
        {[
          { label:'Open Positions', value:String(positions.length), color:'#f0f0f4' },
          { label:'Net P&L', value: live ? formatPnl(total,ccy) : '—', color: live?(total>=0?'#00e5a0':'#ff4f6a'):'#8888a0' },
        ].map(c => (
          <div key={c.label} style={{ background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#8888a0', marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:18, fontWeight:700, color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      <button onClick={openPanel} style={{ width:'100%', padding:'11px 0', border:'none', borderRadius:8,
        background:'linear-gradient(135deg,#00e5a0,#00b37e)', fontWeight:700, fontSize:13, color:'#0d0d12', cursor:'pointer' }}>
        Open Dashboard →
      </button>
    </div>
  );
}
