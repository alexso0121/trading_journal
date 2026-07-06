import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { Dialog } from '../components/Dialog';
import { ApiError, createApiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import type { Strategy, Trade } from '../types/models';

type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

type TradeFormState = {
  strategyId: string;
  ticker: string;
  market: string;
  asset: number;
  direction: number;
  status: number;
  entryPrice: string;
  quantity: string;
  pnl: string;
  comments: string;
  openTimeUtc: string;
  closeTimeUtc: string;
};

const emptyForm: TradeFormState = {
  strategyId: '',
  ticker: '',
  market: '',
  asset: 1,
  direction: 1,
  status: 1,
  entryPrice: '',
  quantity: '',
  pnl: '0',
  comments: '',
  openTimeUtc: '',
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
  const [createForm, setCreateForm] = useState<TradeFormState>(emptyForm);
  const [editForm, setEditForm] = useState<TradeFormState>(emptyForm);
  const [editing, setEditing] = useState<Trade | null>(null);

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
        ...emptyForm,
        strategyId: prev.strategyId,
      }));
      setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
      await loadData(1, pagination.pageSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create trade.');
    }
  };

  const onDelete = async (trade: Trade) => {
    if (!window.confirm(`Delete trade "${trade.ticker}"?`)) {
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
              accessor: 'version',
              title: 'Version',
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

      <Dialog
        open={createOpen}
        title="Create trade"
        onClose={() => {
          setCreateOpen(false);
        }}
      >
        <div className="grid gap-2 md:grid-cols-2">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createForm.strategyId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, strategyId: e.target.value }))}
          >
            <option value="">Select strategy</option>
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Ticker"
            value={createForm.ticker}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, ticker: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Market"
            value={createForm.market}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, market: e.target.value }))}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createForm.asset}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, asset: Number(e.target.value) }))}
          >
            <option value={1}>Stock</option>
            <option value={2}>Future</option>
            <option value={3}>Contract</option>
            <option value={4}>Crypto</option>
            <option value={5}>Forex</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createForm.direction}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, direction: Number(e.target.value) }))
            }
          >
            <option value={1}>Long</option>
            <option value={2}>Short</option>
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="Entry price"
            value={createForm.entryPrice}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, entryPrice: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="Quantity"
            value={createForm.quantity}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="PnL"
            value={createForm.pnl}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, pnl: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="datetime-local"
            value={createForm.openTimeUtc}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, openTimeUtc: e.target.value }))}
          />
          <textarea
            className="md:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Comments"
            value={createForm.comments}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, comments: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void onCreate();
            }}
          >
            Save
          </button>
        </div>
      </Dialog>

      <Dialog
        open={editOpen}
        title={`Edit trade${editing ? `: ${editing.ticker}` : ''}`}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
      >
        <div className="grid gap-2 md:grid-cols-2">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.strategyId}
            onChange={(e) => setEditForm((prev) => ({ ...prev, strategyId: e.target.value }))}
          >
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.ticker}
            onChange={(e) => setEditForm((prev) => ({ ...prev, ticker: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.market}
            onChange={(e) => setEditForm((prev) => ({ ...prev, market: e.target.value }))}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.asset}
            onChange={(e) => setEditForm((prev) => ({ ...prev, asset: Number(e.target.value) }))}
          >
            <option value={1}>Stock</option>
            <option value={2}>Future</option>
            <option value={3}>Contract</option>
            <option value={4}>Crypto</option>
            <option value={5}>Forex</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.direction}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, direction: Number(e.target.value) }))
            }
          >
            <option value={1}>Long</option>
            <option value={2}>Short</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.status}
            onChange={(e) => setEditForm((prev) => ({ ...prev, status: Number(e.target.value) }))}
          >
            <option value={1}>Open</option>
            <option value={2}>Closed</option>
            <option value={3}>Cancelled</option>
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            value={editForm.entryPrice}
            onChange={(e) => setEditForm((prev) => ({ ...prev, entryPrice: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            value={editForm.quantity}
            onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            value={editForm.pnl}
            onChange={(e) => setEditForm((prev) => ({ ...prev, pnl: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="datetime-local"
            value={editForm.openTimeUtc}
            onChange={(e) => setEditForm((prev) => ({ ...prev, openTimeUtc: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="datetime-local"
            value={editForm.closeTimeUtc}
            onChange={(e) => setEditForm((prev) => ({ ...prev, closeTimeUtc: e.target.value }))}
          />
          <textarea
            className="md:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Comments"
            value={editForm.comments}
            onChange={(e) => setEditForm((prev) => ({ ...prev, comments: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void onUpdate();
            }}
          >
            Update
          </button>
        </div>
      </Dialog>
    </section>
  );
};
