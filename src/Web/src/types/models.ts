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
  tags: StrategyTag[];
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  trades: StrategyTrade[];
};

export type StrategyTag = {
  id: string;
  name: string;
};

export type Trade = {
  id: string;
  strategyId: string;
  userId: string;
  ticker: string;
  market: string;
  asset: number;
  direction: number;
  status: number;
  entryPrice: number;
  quantity: number;
  pnl: number;
  comments: string;
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
  tradeIdea: string;
  reflection: string;
  note: string;
  screenshots: DailyJournalScreenshot[];
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type DailyJournalScreenshot = {
  id: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  downloadUrl: string;
  expiresAtUtc: string;
  createdAtUtc: string;
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
  startDateUtc?: string;
  endDateUtc?: string;
};

export type GetAuditLogsParams = {
  pageNumber?: number;
  pageSize?: number;
};

export type CreateStrategyPayload = {
  name: string;
  description: string;
  tags: string[];
};

export type UpdateStrategyPayload = CreateStrategyPayload & {
  lastKnownVersion: number;
};

export type CreateTradePayload = {
  strategyId: string;
  ticker: string;
  market: string;
  asset: number;
  direction: number;
  entryPrice: number;
  quantity: number;
  pnl: number;
  comments: string;
  openTimeUtc: string;
};

export type UpdateTradePayload = {
  strategyId: string;
  ticker: string;
  market: string;
  asset: number;
  direction: number;
  status: number;
  entryPrice: number;
  quantity: number;
  pnl: number;
  comments: string;
  openTimeUtc: string;
  closeTimeUtc: string | null;
  lastKnownVersion: number;
};

export type CreateDailyJournalPayload = {
  journalDateUtc: string;
  tradeIdea: string;
  reflection: string;
};

export type UpdateDailyJournalPayload = {
  journalDateUtc: string;
  tradeIdea: string;
  reflection: string;
};

export type CreateJournalScreenshotUploadUrlPayload = {
  fileName: string;
  contentType: string;
};

export type JournalScreenshotUploadUrlResponse = {
  storageKey: string;
  uploadUrl: string;
  downloadUrl: string;
  expiresAtUtc: string;
};

export type CreateStrategyContentImageUploadUrlPayload = {
  fileName: string;
  contentType: string;
};

export type StrategyContentImageUploadUrlResponse = {
  storageKey: string;
  uploadUrl: string;
  downloadUrl: string;
  expiresAtUtc: string;
};
