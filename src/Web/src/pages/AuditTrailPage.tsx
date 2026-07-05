import { useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../lib/apiClient'
import { useAuth } from '../providers/AuthProvider'
import type { AuditLog } from '../types/models'

const trimPayload = (payloadJson: string) => {
  if (payloadJson.length <= 180) {
    return payloadJson
  }
  return `${payloadJson.slice(0, 180)}...`
}

export const AuditTrailPage = () => {
  const { getToken } = useAuth()
  const api = useMemo(() => createApiClient(getToken), [getToken])

  const [items, setItems] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await api.getAuditLogs(300))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit trail.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Trail</h2>
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Payload</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(item.occurredAtUtc).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div>{item.entityType}</div>
                  <div className="text-xs text-slate-500">{item.entityId}</div>
                </td>
                <td className="px-3 py-2">{item.eventType}</td>
                <td className="px-3 py-2">{item.version ?? '-'}</td>
                <td className="px-3 py-2">
                  <code className="text-xs text-slate-700">{trimPayload(item.payloadJson)}</code>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                  No audit events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
