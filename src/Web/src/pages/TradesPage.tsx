import { useEffect, useMemo, useState } from 'react';
import { Button, Select, TextInput, Textarea } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import {
  CreateTradeDialog,
  emptyTradeCreateForm,
  type TradeCreateFormState,
} from '../components/CreateTradeDialog';
import { Dialog } from '../components/Dialog';
import { ApiError, createApiClient } from '../lib/apiClient';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import type { Strategy, Trade } from '../types/models';

type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

type TradeFormState = TradeCreateFormState & {
  status: number;
  closeTimeUtc: string;
};

const emptyCreateForm: TradeCreateFormState = {
  ...emptyTradeCreateForm,
};

const emptyForm: TradeFormState = {
  ...emptyTradeCreateForm,
  status: 1,
  closeTimeUtc: '',
};

const toDateTimeLocal = (isoUtc: string) => {
  const date = new Date(isoUtc);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const TradesPage = () => {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);
  const toast = useToast();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [filterStrategyId, setFilterStrategyId] = useState('');
  const [filterTradingDate, setFilterTradingDate] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TradeCreateFormState>(emptyCreateForm);
  const [editForm, setEditForm] = useState<TradeFormState>(emptyForm);
  const [editing, setEditing] = useState<Trade | null>(null);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, 'Trades');
    setError(null);
  }, [error, toast]);

  const loadData = async (
    targetPage = pagination.pageIndex + 1,
    targetPageSize = pagination.pageSize,
    strategyFilter = filterStrategyId,
    tradingDateFilter = filterTradingDate
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [tradeResponse, strategyResponse] = await Promise.all([
        api.getTrades({
          pageNumber: targetPage,
          pageSize: targetPageSize,
          strategyId: strategyFilter || undefined,
          tradingDateUtc: tradingDateFilter || undefined,
        }),
        api.getStrategies({ pageNumber: 1, pageSize: 100 }),
      ]);
      setTrades(tradeResponse.items);
      setTotalCount(tradeResponse.totalCount);
      setPagination((prev) => {
        const nextPageIndex = Math.max(0, tradeResponse.pageNumber - 1);
        const nextPageSize = tradeResponse.pageSize;
        if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
          return prev;
        }
        return {
          pageIndex: nextPageIndex,
          pageSize: nextPageSize,
        };
      });
      setStrategies(strategyResponse.items);
      if (strategyResponse.items.length > 0) {
        setCreateForm((prev) => ({
          ...prev,
          strategyId: prev.strategyId || strategyResponse.items[0].id,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(pagination.pageIndex + 1, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize]);

  const onCreate = async () => {
    if (
      !createForm.strategyId ||
      !createForm.ticker.trim() ||
      !createForm.market.trim() ||
      !createForm.entryPrice ||
      !createForm.quantity ||
      !createForm.openTimeUtc
    ) {
      setError('Please complete all required fields.');
      return;
    }

    setError(null);
    try {
      await api.createTrade({
        strategyId: createForm.strategyId,
        ticker: createForm.ticker.trim(),
        market: createForm.market.trim(),
        asset: createForm.asset,
        direction: createForm.direction,
        entryPrice: Number(createForm.entryPrice),
        quantity: Number(createForm.quantity),
        pnl: Number(createForm.pnl || 0),
        comments: createForm.comments,
        openTimeUtc: new Date(createForm.openTimeUtc).toISOString(),
      });
      setCreateOpen(false);
      setCreateForm((prev) => ({
        ...emptyTradeCreateForm,
        strategyId: prev.strategyId,
      }));
      setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
      await loadData(1, pagination.pageSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create trade.');
    }
  };

  const onDelete = async (trade: Trade) => {
    const confirmed = await toast.confirm({
      title: 'Delete trade',
      message: `Delete trade "${trade.ticker}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await api.deleteTrade(trade.id, trade.version);
      await loadData(pagination.pageIndex + 1, pagination.pageSize);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: trade changed on server. Refresh and try again.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to delete trade.');
    }
  };

  const startEdit = (trade: Trade) => {
    setEditing(trade);
    setEditForm({
      strategyId: trade.strategyId,
      ticker: trade.ticker,
      market: trade.market,
      asset: trade.asset,
      direction: trade.direction,
      status: trade.status,
      entryPrice: String(trade.entryPrice),
      quantity: String(trade.quantity),
      pnl: String(trade.pnl),
      comments: trade.comments,
      openTimeUtc: toDateTimeLocal(trade.openTimeUtc),
      closeTimeUtc: trade.closeTimeUtc ? toDateTimeLocal(trade.closeTimeUtc) : '',
    });
    setEditOpen(true);
  };

  const onUpdate = async () => {
    if (!editing) {
      return;
    }

    if (
      !editForm.strategyId ||
      !editForm.ticker.trim() ||
      !editForm.market.trim() ||
      !editForm.entryPrice ||
      !editForm.quantity ||
      !editForm.openTimeUtc
    ) {
      setError('Please complete all required fields.');
      return;
    }

    setError(null);
    try {
      await api.updateTrade(editing.id, {
        strategyId: editForm.strategyId,
        ticker: editForm.ticker.trim(),
        market: editForm.market.trim(),
        asset: editForm.asset,
        direction: editForm.direction,
        status: editForm.status,
        entryPrice: Number(editForm.entryPrice),
        quantity: Number(editForm.quantity),
        pnl: Number(editForm.pnl || 0),
        comments: editForm.comments,
        openTimeUtc: new Date(editForm.openTimeUtc).toISOString(),
        closeTimeUtc: editForm.closeTimeUtc ? new Date(editForm.closeTimeUtc).toISOString() : null,
        lastKnownVersion: editing.version,
      });
      setEditOpen(false);
      setEditing(null);
      await loadData(pagination.pageIndex + 1, pagination.pageSize);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: trade changed on server. Refresh and try again.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to update trade.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Trades</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={() => setCreateOpen(true)}
          >
            New trade
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            onClick={() => {
              void loadData(pagination.pageIndex + 1, pagination.pageSize);
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex lg:w-2/3  gap-6">
        <div className="flex gap-2">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={filterStrategyId}
            onChange={(e) => setFilterStrategyId(e.target.value)}
          >
            <option value="">All strategies</option>
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterTradingDate}
            onChange={(e) => setFilterTradingDate(e.target.value)}
            className="w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            onClick={() => {
              setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
              void loadData(1, pagination.pageSize, filterStrategyId, filterTradingDate);
            }}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            onClick={() => {
              setFilterStrategyId('');
              setFilterTradingDate('');
              setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
              void loadData(1, pagination.pageSize, '', '');
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <DataTable
          withTableBorder
          highlightOnHover
          striped
          records={trades}
          fetching={loading}
          totalRecords={totalCount}
          recordsPerPage={pagination.pageSize}
          page={pagination.pageIndex + 1}
          onPageChange={(page) => {
            setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
          }}
          recordsPerPageOptions={[10, 20, 50]}
          onRecordsPerPageChange={(pageSize) => {
            setPagination({ pageIndex: 0, pageSize });
          }}
          columns={[
            {
              accessor: 'ticker',
              title: 'Ticker',
              render: (trade) => (
                <>
                  {trade.ticker} <span className="text-xs text-slate-500">({trade.market})</span>
                </>
              ),
            },
            {
              accessor: 'direction',
              title: 'Direction',
              render: (trade) => (trade.direction === 1 ? 'Long' : 'Short'),
            },
            {
              accessor: 'asset',
              title: 'Asset',
              render: (trade) =>
                trade.asset === 1
                  ? 'Stock'
                  : trade.asset === 2
                    ? 'Future'
                    : trade.asset === 3
                      ? 'Contract'
                      : trade.asset === 4
                        ? 'Crypto'
                        : 'Forex',
            },
            {
              accessor: 'status',
              title: 'Status',
              render: (trade) =>
                trade.status === 1 ? 'Open' : trade.status === 2 ? 'Closed' : 'Cancelled',
            },
            {
              accessor: 'entryPrice',
              title: 'Entry',
            },
            {
              accessor: 'quantity',
              title: 'Qty',
            },
            {
              accessor: 'pnl',
              title: 'PnL',
            },
            {
              accessor: 'openTimeUtc',
              title: 'Open',
              render: (trade) => new Date(trade.openTimeUtc).toLocaleString(),
            },

            {
              accessor: 'actions',
              title: '',
              render: (trade) => (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                    onClick={() => startEdit(trade)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      void onDelete(trade);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <CreateTradeDialog
        open={createOpen}
        title="Create trade"
        strategies={strategies}
        form={createForm}
        creating={false}
        onChange={(updater) => {
          setCreateForm((prev) => updater(prev));
        }}
        onClose={() => {
          setCreateOpen(false);
        }}
        onSave={() => {
          void onCreate();
        }}
      />

      <Dialog
        open={editOpen}
        title={`Edit trade${editing ? `: ${editing.ticker}` : ''}`}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
      >
        <div className="grid gap-2 md:grid-cols-2">
          <Select
            label="Strategy"
            value={editForm.strategyId}
            data={strategies.map((strategy) => ({ value: strategy.id, label: strategy.name }))}
            onChange={(value) => setEditForm((prev) => ({ ...prev, strategyId: value ?? '' }))}
          />
          <TextInput
            label="Ticker"
            value={editForm.ticker}
            onChange={(e) => setEditForm((prev) => ({ ...prev, ticker: e.target.value }))}
          />
          <TextInput
            label="Market"
            value={editForm.market}
            onChange={(e) => setEditForm((prev) => ({ ...prev, market: e.target.value }))}
          />
          <Select
            label="Asset"
            value={String(editForm.asset)}
            data={[
              { value: '1', label: 'Stock' },
              { value: '2', label: 'Future' },
              { value: '3', label: 'Contract' },
              { value: '4', label: 'Crypto' },
              { value: '5', label: 'Forex' },
            ]}
            onChange={(value) => setEditForm((prev) => ({ ...prev, asset: Number(value ?? '1') }))}
          />
          <Select
            label="Direction"
            value={String(editForm.direction)}
            data={[
              { value: '1', label: 'Long' },
              { value: '2', label: 'Short' },
            ]}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, direction: Number(value ?? '1') }))
            }
          />
          <Select
            label="Status"
            value={String(editForm.status)}
            data={[
              { value: '1', label: 'Open' },
              { value: '2', label: 'Closed' },
              { value: '3', label: 'Cancelled' },
            ]}
            onChange={(value) => setEditForm((prev) => ({ ...prev, status: Number(value ?? '1') }))}
          />
          <TextInput
            label="Entry price"
            type="number"
            step="0.000001"
            value={editForm.entryPrice}
            onChange={(e) => setEditForm((prev) => ({ ...prev, entryPrice: e.target.value }))}
          />
          <TextInput
            label="Quantity"
            type="number"
            step="0.000001"
            value={editForm.quantity}
            onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          <TextInput
            label="PnL"
            type="number"
            step="0.000001"
            value={editForm.pnl}
            onChange={(e) => setEditForm((prev) => ({ ...prev, pnl: e.target.value }))}
          />
          <TextInput
            label="Open time"
            type="datetime-local"
            value={editForm.openTimeUtc}
            onChange={(e) => setEditForm((prev) => ({ ...prev, openTimeUtc: e.target.value }))}
          />
          <TextInput
            label="Close time"
            type="datetime-local"
            value={editForm.closeTimeUtc}
            onChange={(e) => setEditForm((prev) => ({ ...prev, closeTimeUtc: e.target.value }))}
          />
          <Textarea
            label="Comments"
            className="md:col-span-2"
            placeholder="Comments"
            value={editForm.comments}
            onChange={(e) => setEditForm((prev) => ({ ...prev, comments: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <Button
            variant="filled"
            color="dark"
            onClick={() => {
              void onUpdate();
            }}
          >
            Update
          </Button>
        </div>
      </Dialog>
    </section>
  );
};
