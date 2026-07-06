export type StrategyTrade = {
  id: string;
  ticker: string;
  market: string;
  entryPrice: number;
  quantity: number;
  version: number;
  openTimeUtc: string;
};

export type Strategy = {
  id: string;
  userId: string;
  name: string;
  description: string;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  trades: StrategyTrade[];
};

export type Trade = {
  id: string;
  strategyId: string;
  userId: string;
  ticker: string;
  market: string;
  direction: number;
  status: number;
  entryPrice: number;
  quantity: number;
  openTimeUtc: string;
  closeTimeUtc: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type DailyJournal = {
  id: string;
  userId: string;
  journalDateUtc: string;
  note: string;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type AuditLog = {
  id: string;
  entityId: string;
  entityType: string;
  eventType: string;
  userId: string;
  version: number | null;
  payloadJson: string;
  occurredAtUtc: string;
};

export type PagedResponse<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

export type GetStrategiesParams = {
  pageNumber?: number;
  pageSize?: number;
};

export type GetTradesParams = {
  pageNumber?: number;
  pageSize?: number;
  strategyId?: string;
  tradingDateUtc?: string;
};

export type GetAuditLogsParams = {
  pageNumber?: number;
  pageSize?: number;
};

export type CreateStrategyPayload = {
  name: string;
  description: string;
};

export type UpdateStrategyPayload = CreateStrategyPayload & {
  lastKnownVersion: number;
};

export type CreateTradePayload = {
  strategyId: string;
  ticker: string;
  market: string;
  direction: number;
  entryPrice: number;
  quantity: number;
  openTimeUtc: string;
};

export type UpdateTradePayload = {
  strategyId: string;
  ticker: string;
  market: string;
  direction: number;
  status: number;
  entryPrice: number;
  quantity: number;
  openTimeUtc: string;
  closeTimeUtc: string | null;
  lastKnownVersion: number;
};

export type CreateDailyJournalPayload = {
  journalDateUtc: string;
  note: string;
};

export type UpdateDailyJournalPayload = {
  journalDateUtc: string;
  note: string;
};
