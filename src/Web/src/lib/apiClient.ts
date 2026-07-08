import axios, { type AxiosError } from 'axios';
import type {
  AuditLog,
  ChecklistConfigItem,
  CreateChecklistConfigItemPayload,
  CreateJournalScreenshotUploadUrlPayload,
  CreateStoredFileTempUploadUrlResponse,
  CreateDailyJournalPayload,
  CreateStrategyPayload,
  CreateTradePayload,
  DailyJournal,
  DailyJournalDetail,
  DailyJournalListItem,
  FinalizeStoredFilesPayload,
  FinalizeStoredFilesResponse,
  GetAuditLogsParams,
  GetStrategiesParams,
  GetTradesParams,
  PagedResponse,
  ResolveStoredFilesPayload,
  ResolveStoredFilesResponse,
  ReorderChecklistConfigItemsPayload,
  Strategy,
  Trade,
  UpdateDailyJournalPayload,
  UpdateStrategyPayload,
  UpdateTradePayload,
} from '../types/models';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5116',
});

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const toApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<{ message?: string }>;
  const status = axiosError.response?.status ?? 500;
  const message =
    axiosError.response?.data?.message ??
    (typeof axiosError.response?.data === 'string'
      ? axiosError.response.data
      : axiosError.message) ??
    'Request failed.';
  return new ApiError(message, status);
};

const toPagedResponse = <T>(value: unknown): PagedResponse<T> => {
  const data = (value ?? {}) as {
    items?: T[];
    Items?: T[];
    pageNumber?: number;
    PageNumber?: number;
    pageSize?: number;
    PageSize?: number;
    totalCount?: number;
    TotalCount?: number;
  };

  return {
    items: data.items ?? data.Items ?? [],
    pageNumber: data.pageNumber ?? data.PageNumber ?? 1,
    pageSize: data.pageSize ?? data.PageSize ?? 20,
    totalCount: data.totalCount ?? data.TotalCount ?? 0,
  };
};

type TokenResolver = () => Promise<string>;

const authHeader = async (resolveToken: TokenResolver) => ({
  Authorization: `Bearer ${await resolveToken()}`,
});

export const createApiClient = (resolveToken: TokenResolver) => ({
  async getStrategies(params: GetStrategiesParams = {}): Promise<PagedResponse<Strategy>> {
    try {
      const response = await api.get<PagedResponse<Strategy>>('/api/strategies', {
        headers: await authHeader(resolveToken),
        params: {
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 20,
        },
      });
      return toPagedResponse<Strategy>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createStrategy(payload: CreateStrategyPayload): Promise<Strategy> {
    try {
      const response = await api.post<Strategy>('/api/strategies', payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateStrategy(strategyId: string, payload: UpdateStrategyPayload): Promise<Strategy> {
    try {
      const response = await api.put<Strategy>(`/api/strategies/${strategyId}`, payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteStrategy(strategyId: string, lastKnownVersion: number): Promise<void> {
    try {
      await api.delete(`/api/strategies/${strategyId}`, {
        headers: await authHeader(resolveToken),
        params: { lastKnownVersion },
      });
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getTrades(params: GetTradesParams = {}): Promise<PagedResponse<Trade>> {
    try {
      const response = await api.get<PagedResponse<Trade>>('/api/trades', {
        headers: await authHeader(resolveToken),
        params: {
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 20,
          strategyId: params.strategyId || undefined,
          tradingDateUtc: params.tradingDateUtc || undefined,
          startDateUtc: params.startDateUtc || undefined,
          endDateUtc: params.endDateUtc || undefined,
        },
      });
      return toPagedResponse<Trade>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createTrade(payload: CreateTradePayload): Promise<Trade> {
    try {
      const response = await api.post<Trade>('/api/trades', payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateTrade(tradeId: string, payload: UpdateTradePayload): Promise<Trade> {
    try {
      const response = await api.put<Trade>(`/api/trades/${tradeId}`, payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteTrade(tradeId: string, lastKnownVersion: number): Promise<void> {
    try {
      await api.delete(`/api/trades/${tradeId}`, {
        headers: await authHeader(resolveToken),
        params: { lastKnownVersion },
      });
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getDailyJournals(): Promise<DailyJournalListItem[]> {
    try {
      const response = await api.get<DailyJournalListItem[]>('/api/dailyjournals', {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getDailyJournalDetail(params: {
    id?: string;
    dateUtc?: string;
  }): Promise<DailyJournalDetail | null> {
    if (!params.id && !params.dateUtc) {
      throw new ApiError('Either id or dateUtc must be provided.', 400);
    }

    try {
      const response = await api.get<DailyJournalDetail | null>('/api/dailyjournals/detail', {
        headers: await authHeader(resolveToken),
        params: {
          id: params.id,
          dateUtc: params.dateUtc,
        },
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createDailyJournal(payload: CreateDailyJournalPayload): Promise<DailyJournal> {
    try {
      const response = await api.post<DailyJournal>('/api/dailyjournals', payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateDailyJournal(
    journalId: string,
    payload: UpdateDailyJournalPayload
  ): Promise<DailyJournal> {
    try {
      const response = await api.put<DailyJournal>(`/api/dailyjournals/${journalId}`, payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createDailyJournalTempFileUploadUrl(
    payload: CreateJournalScreenshotUploadUrlPayload
  ): Promise<CreateStoredFileTempUploadUrlResponse> {
    try {
      const response = await api.post<CreateStoredFileTempUploadUrlResponse>(
        '/api/files/journal-content/temp-upload-url',
        payload,
        {
          headers: await authHeader(resolveToken),
        }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async finalizeDailyJournalFiles(
    journalId: string,
    payload: FinalizeStoredFilesPayload
  ): Promise<FinalizeStoredFilesResponse> {
    try {
      const response = await api.post<FinalizeStoredFilesResponse>(
        `/api/dailyjournals/${journalId}/screenshot/finalize`,
        payload,
        {
          headers: await authHeader(resolveToken),
        }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async uploadFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
    try {
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createStrategyContentTempFileUploadUrl(
    payload: CreateJournalScreenshotUploadUrlPayload
  ): Promise<CreateStoredFileTempUploadUrlResponse> {
    try {
      const response = await api.post<CreateStoredFileTempUploadUrlResponse>(
        '/api/files/strategy-content/temp-upload-url',
        payload,
        {
          headers: await authHeader(resolveToken),
        }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async finalizeStrategyFiles(
    strategyId: string,
    payload: FinalizeStoredFilesPayload
  ): Promise<FinalizeStoredFilesResponse> {
    try {
      const response = await api.post<FinalizeStoredFilesResponse>(
        `/api/strategies/${strategyId}/content-image/finalize`,
        payload,
        {
          headers: await authHeader(resolveToken),
        }
      );
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async resolveStoredFiles(
    payload: ResolveStoredFilesPayload
  ): Promise<ResolveStoredFilesResponse> {
    try {
      const response = await api.post<ResolveStoredFilesResponse>('/api/files/resolve', payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getAuditLogs(params: GetAuditLogsParams = {}): Promise<PagedResponse<AuditLog>> {
    try {
      const response = await api.get<PagedResponse<AuditLog>>('/api/auditlogs', {
        headers: await authHeader(resolveToken),
        params: {
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 20,
        },
      });
      return toPagedResponse<AuditLog>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getChecklistSettings(): Promise<ChecklistConfigItem[]> {
    try {
      const response = await api.get<ChecklistConfigItem[]>('/api/checklistsettings', {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async createChecklistSetting(
    payload: CreateChecklistConfigItemPayload
  ): Promise<ChecklistConfigItem> {
    try {
      const response = await api.post<ChecklistConfigItem>('/api/checklistsettings', payload, {
        headers: await authHeader(resolveToken),
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async deleteChecklistSetting(itemId: string): Promise<void> {
    try {
      await api.delete(`/api/checklistsettings/${itemId}`, {
        headers: await authHeader(resolveToken),
      });
    } catch (error) {
      throw toApiError(error);
    }
  },

  async reorderChecklistSettings(payload: ReorderChecklistConfigItemsPayload): Promise<void> {
    try {
      await api.put('/api/checklistsettings/reorder', payload, {
        headers: await authHeader(resolveToken),
      });
    } catch (error) {
      throw toApiError(error);
    }
  },
});
