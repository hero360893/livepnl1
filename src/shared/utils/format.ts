export function formatPrice(n: number, ccy = 'USDT'): string {
  if (ccy === 'INR') return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}
export function formatPnl(n: number, ccy = 'USDT'): string {
  return (n >= 0 ? '+' : '') + formatPrice(n, ccy);
}
export function pct(n: number): string {
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%';
}
