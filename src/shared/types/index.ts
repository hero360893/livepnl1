export type Exchange = 'coindcx' | 'binance';
export type MarketType = 'spot' | 'futures';

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  hasCostBasis: boolean;
  quoteCurrency: string;
  exchange: Exchange;
  marketType: MarketType;
  updatedAt: number;
}

export interface AppSettings {
  exchange: Exchange;
  marketType: MarketType;
  apiKey: string;
  apiSecret: string;
  theme: 'dark' | 'light';
  refreshInterval: number;
  installTimestamp: number;
  isPro: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  exchange: 'coindcx', marketType: 'spot',
  apiKey: '', apiSecret: '', theme: 'dark',
  refreshInterval: 5000, installTimestamp: 0, isPro: false,
};
