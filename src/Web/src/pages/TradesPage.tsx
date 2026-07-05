import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '../components/Dialog'
import { ApiError, createApiClient } from '../lib/apiClient'
import { useAuth } from '../providers/AuthProvider'
import type { Strategy, Trade } from '../types/models'

type TradeFormState = {
  strategyId: string
  ticker: string
  market: string
  direction: number
  status: number
  entryPrice: string
  quantity: string
  openTimeUtc: string
  closeTimeUtc: string
}

const emptyForm: TradeFormState = {
  strategyId: '',
  ticker: '',
  market: '',
  direction: 1,
  status: 1,
  entryPrice: '',
  quantity: '',
  openTimeUtc: '',
  closeTimeUtc: '',
}

const toDateTimeLocal = (isoUtc: string) => {
  const date = new Date(isoUtc)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export const TradesPage = () => {
  const { getToken } = useAuth()
  const api = useMemo(() => createApiClient(getToken), [getToken])

  const [trades, setTrades] = useState<Trade[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filterStrategyId, setFilterStrategyId] = useState('')
  const [filterTradingDate, setFilterTradingDate] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createForm, setCreateForm] = useState<TradeFormState>(emptyForm)
  const [editForm, setEditForm] = useState<TradeFormState>(emptyForm)
  const [editing, setEditing] = useState<Trade | null>(null)

  const loadData = async (
    targetPage = pageNumber,
    strategyFilter = filterStrategyId,
    tradingDateFilter = filterTradingDate,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const [tradeResponse, strategyResponse] = await Promise.all([
        api.getTrades({
          pageNumber: targetPage,
          pageSize,
          strategyId: strategyFilter || undefined,
          tradingDateUtc: tradingDateFilter || undefined,
        }),
        api.getStrategies({ pageNumber: 1, pageSize: 100 }),
      ])
      setTrades(tradeResponse.items)
      setPageNumber(tradeResponse.pageNumber)
      setTotalCount(tradeResponse.totalCount)
      setStrategies(strategyResponse.items)
      if (strategyResponse.items.length > 0) {
        setCreateForm((prev) => ({
          ...prev,
          strategyId: prev.strategyId || strategyResponse.items[0].id,
        }))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [pageSize])

  const onCreate = async () => {
    if (
      !createForm.strategyId ||
      !createForm.ticker.trim() ||
      !createForm.market.trim() ||
      !createForm.entryPrice ||
      !createForm.quantity ||
      !createForm.openTimeUtc
    ) {
      setError('Please complete all required fields.')
      return
    }

    setError(null)
    try {
      await api.createTrade({
        strategyId: createForm.strategyId,
        ticker: createForm.ticker.trim(),
        market: createForm.market.trim(),
        direction: createForm.direction,
        entryPrice: Number(createForm.entryPrice),
        quantity: Number(createForm.quantity),
        openTimeUtc: new Date(createForm.openTimeUtc).toISOString(),
      })
      setCreateOpen(false)
      setCreateForm((prev) => ({
        ...emptyForm,
        strategyId: prev.strategyId,
      }))
      await loadData(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create trade.')
    }
  }

  const onDelete = async (trade: Trade) => {
    if (!window.confirm(`Delete trade "${trade.ticker}"?`)) {
      return
    }

    setError(null)
    try {
      await api.deleteTrade(trade.id, trade.version)
      await loadData()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: trade changed on server. Refresh and try again.')
        return
      }
      setError(e instanceof Error ? e.message : 'Failed to delete trade.')
    }
  }

  const startEdit = (trade: Trade) => {
    setEditing(trade)
    setEditForm({
      strategyId: trade.strategyId,
      ticker: trade.ticker,
      market: trade.market,
      direction: trade.direction,
      status: trade.status,
      entryPrice: String(trade.entryPrice),
      quantity: String(trade.quantity),
      openTimeUtc: toDateTimeLocal(trade.openTimeUtc),
      closeTimeUtc: trade.closeTimeUtc ? toDateTimeLocal(trade.closeTimeUtc) : '',
    })
    setEditOpen(true)
  }

  const onUpdate = async () => {
    if (!editing) {
      return
    }

    if (
      !editForm.strategyId ||
      !editForm.ticker.trim() ||
      !editForm.market.trim() ||
      !editForm.entryPrice ||
      !editForm.quantity ||
      !editForm.openTimeUtc
    ) {
      setError('Please complete all required fields.')
      return
    }

    setError(null)
    try {
      await api.updateTrade(editing.id, {
        strategyId: editForm.strategyId,
        ticker: editForm.ticker.trim(),
        market: editForm.market.trim(),
        direction: editForm.direction,
        status: editForm.status,
        entryPrice: Number(editForm.entryPrice),
        quantity: Number(editForm.quantity),
        openTimeUtc: new Date(editForm.openTimeUtc).toISOString(),
        closeTimeUtc: editForm.closeTimeUtc ? new Date(editForm.closeTimeUtc).toISOString() : null,
        lastKnownVersion: editing.version,
      })
      setEditOpen(false)
      setEditing(null)
      await loadData()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: trade changed on server. Refresh and try again.')
        return
      }
      setError(e instanceof Error ? e.message : 'Failed to update trade.')
    }
  }

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
              void loadData()
            }}
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-4">
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={filterTradingDate}
            onChange={(e) => setFilterTradingDate(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            onClick={() => {
              void loadData(1, filterStrategyId, filterTradingDate)
            }}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            onClick={() => {
              setFilterStrategyId('')
              setFilterTradingDate('')
              void loadData(1, '', '')
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Ticker</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Entry</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Open</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-t border-slate-200">
                <td className="px-3 py-2">
                  {trade.ticker} <span className="text-xs text-slate-500">({trade.market})</span>
                </td>
                <td className="px-3 py-2">{trade.direction === 1 ? 'Long' : 'Short'}</td>
                <td className="px-3 py-2">{trade.status === 1 ? 'Open' : trade.status === 2 ? 'Closed' : 'Cancelled'}</td>
                <td className="px-3 py-2">{trade.entryPrice}</td>
                <td className="px-3 py-2">{trade.quantity}</td>
                <td className="px-3 py-2">{new Date(trade.openTimeUtc).toLocaleString()}</td>
                <td className="px-3 py-2">{trade.version}</td>
                <td className="px-3 py-2">
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
                        void onDelete(trade)
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Showing {trades.length} of {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                        disabled={pageNumber <= 1 || loading}
                        onClick={() => {
                          void loadData(pageNumber - 1)
                        }}
                      >
                        Previous
                      </button>
                      <span>Page {pageNumber}</span>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                        disabled={pageNumber * pageSize >= totalCount || loading}
                        onClick={() => {
                          void loadData(pageNumber + 1)
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {trades.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                  No trades yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog
        open={createOpen}
        title="Create trade"
        onClose={() => {
          setCreateOpen(false)
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
            value={createForm.direction}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, direction: Number(e.target.value) }))}
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
            type="datetime-local"
            value={createForm.openTimeUtc}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, openTimeUtc: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void onCreate()
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
          setEditOpen(false)
          setEditing(null)
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
            value={editForm.direction}
            onChange={(e) => setEditForm((prev) => ({ ...prev, direction: Number(e.target.value) }))}
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
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void onUpdate()
            }}
          >
            Update
          </button>
        </div>
      </Dialog>
    </section>
  )
}
