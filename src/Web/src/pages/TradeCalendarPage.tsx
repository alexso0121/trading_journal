import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { useEffect, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Dialog } from '../components/Dialog'
import { createApiClient } from '../lib/apiClient'
import { useAuth } from '../providers/AuthProvider'
import type { DailyJournal, Trade } from '../types/models'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type CalendarTradeEvent = {
  title: string
  start: Date
  end: Date
  allDay: false
  resource: Trade
}

const toDayKey = (date: Date) => format(date, 'yyyy-MM-dd')

const toJournalIso = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString()

export const TradeCalendarPage = () => {
  const { getToken } = useAuth()
  const api = useMemo(() => createApiClient(getToken), [getToken])

  const [trades, setTrades] = useState<Trade[]>([])
  const [journals, setJournals] = useState<DailyJournal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [journalNote, setJournalNote] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tradeData, journalData] = await Promise.all([
        api.getTrades({ pageNumber: 1, pageSize: 100 }),
        api.getDailyJournals(),
      ])
      setTrades(tradeData.items)
      setJournals(journalData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const events = useMemo<CalendarTradeEvent[]>(
    () =>
      trades.map((trade) => {
        const openTime = new Date(trade.openTimeUtc)
        return {
          title: `${trade.ticker} (${trade.quantity})`,
          start: openTime,
          end: openTime,
          allDay: false,
          resource: trade,
        }
      }),
    [trades],
  )

  const selectedDayKey = selectedDate ? toDayKey(selectedDate) : null
  const selectedJournalDatePart = selectedDate ? toJournalIso(selectedDate).slice(0, 10) : null

  const dayTrades = useMemo(() => {
    if (!selectedDayKey) {
      return []
    }
    return trades.filter((trade) => toDayKey(new Date(trade.openTimeUtc)) === selectedDayKey)
  }, [selectedDayKey, trades])

  const existingJournal = useMemo(() => {
    if (!selectedJournalDatePart) {
      return null
    }
    return journals.find((journal) => journal.journalDateUtc.slice(0, 10) === selectedJournalDatePart) ?? null
  }, [journals, selectedJournalDatePart])

  useEffect(() => {
    setJournalNote(existingJournal?.note ?? '')
  }, [existingJournal])

  const openDayDialog = (date: Date) => {
    setSelectedDate(date)
    setDialogOpen(true)
  }

  const saveJournal = async () => {
    if (!selectedDate) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        journalDateUtc: toJournalIso(selectedDate),
        note: journalNote,
      }

      if (existingJournal) {
        const updated = await api.updateDailyJournal(existingJournal.id, payload)
        setJournals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await api.createDailyJournal(payload)
        setJournals((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save daily journal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trade Calendar</h2>
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

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 680 }}
          onSelectSlot={(slotInfo) => openDayDialog(slotInfo.start)}
          onSelectEvent={(event) => openDayDialog((event as CalendarTradeEvent).start)}
          selectable
        />
      </div>

      <Dialog
        open={dialogOpen}
        title={selectedDate ? `Daily Journal - ${selectedDate.toLocaleDateString()}` : 'Daily Journal'}
        onClose={() => setDialogOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">Trades of the day</h4>
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-3 py-2">Ticker</th>
                    <th className="px-3 py-2">Direction</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Open time</th>
                  </tr>
                </thead>
                <tbody>
                  {dayTrades.map((trade) => (
                    <tr key={trade.id} className="border-t border-slate-200">
                      <td className="px-3 py-2">
                        {trade.ticker} <span className="text-xs text-slate-500">({trade.market})</span>
                      </td>
                      <td className="px-3 py-2">{trade.direction === 1 ? 'Long' : 'Short'}</td>
                      <td className="px-3 py-2">{trade.quantity}</td>
                      <td className="px-3 py-2">{new Date(trade.openTimeUtc).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                  {dayTrades.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-center text-slate-500">
                        No trades for this day.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Daily notes</h4>
            <textarea
              className="h-36 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="How was your execution, risk, and psychology today?"
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={saving}
            onClick={() => {
              void saveJournal()
            }}
          >
            {existingJournal ? 'Update journal' : 'Save journal'}
          </button>
        </div>
      </Dialog>
    </section>
  )
}
