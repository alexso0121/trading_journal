import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '../components/Dialog'
import { ApiError, createApiClient } from '../lib/apiClient'
import { useAuth } from '../providers/AuthProvider'
import type { Strategy } from '../types/models'

type StrategyFormState = {
  name: string
  description: string
}

const emptyForm: StrategyFormState = { name: '', description: '' }

export const StrategiesPage = () => {
  const { getToken } = useAuth()
  const api = useMemo(() => createApiClient(getToken), [getToken])

  const [items, setItems] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createForm, setCreateForm] = useState<StrategyFormState>(emptyForm)
  const [editForm, setEditForm] = useState<StrategyFormState>(emptyForm)
  const [editing, setEditing] = useState<Strategy | null>(null)

  const loadData = async (targetPage = pageNumber) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getStrategies({
        pageNumber: targetPage,
        pageSize,
      })
      setItems(response.items)
      setPageNumber(response.pageNumber)
      setTotalCount(response.totalCount)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load strategies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [pageSize])

  const onCreate = async () => {
    if (!createForm.name.trim()) {
      setError('Name is required.')
      return
    }

    setError(null)
    try {
    await api.createStrategy({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      })
    setCreateForm(emptyForm)
    setCreateOpen(false)
    await loadData(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create strategy.')
    }
  }

  const onDelete = async (strategy: Strategy) => {
    if (!window.confirm(`Delete strategy "${strategy.name}"?`)) {
      return
    }

    setError(null)
    try {
      await api.deleteStrategy(strategy.id, strategy.version)
      await loadData()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: strategy changed on server. Refresh and try again.')
        return
      }
      setError(e instanceof Error ? e.message : 'Failed to delete strategy.')
    }
  }

  const startEdit = (strategy: Strategy) => {
    setEditing(strategy)
    setEditForm({ name: strategy.name, description: strategy.description })
    setEditOpen(true)
  }

  const onUpdate = async () => {
    if (!editing) {
      return
    }

    if (!editForm.name.trim()) {
      setError('Name is required.')
      return
    }

    setError(null)
    try {
      const updated = await api.updateStrategy(editing.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        lastKnownVersion: editing.version,
      })
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditOpen(false)
      setEditing(null)
      await loadData()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Conflict: strategy changed on server. Refresh and try again.')
        return
      }
      setError(e instanceof Error ? e.message : 'Failed to update strategy.')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Strategies</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={() => setCreateOpen(true)}
          >
            New strategy
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
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Trades</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{item.description || '-'}</td>
                <td className="px-3 py-2">{item.version}</td>
                <td className="px-3 py-2">{item.trades.length}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        void onDelete(item)
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      Showing {items.length} of {totalCount}
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
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                  No strategies yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog
        open={createOpen}
        title="Create strategy"
        onClose={() => {
          setCreateOpen(false)
          setCreateForm(emptyForm)
        }}
      >
        <div className="space-y-3">
          <input
            placeholder="Strategy name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea
            placeholder="Description"
            className="h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
          />
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
        title={`Edit strategy${editing ? `: ${editing.name}` : ''}`}
        onClose={() => {
          setEditOpen(false)
          setEditing(null)
        }}
      >
        <div className="space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.name}
            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <textarea
            className="h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={editForm.description}
            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
          />
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
