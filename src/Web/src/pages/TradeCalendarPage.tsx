import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Group, Table } from '@mantine/core'
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

const toDayKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toJournalIso = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString()

export const TradeCalendarPage = () => {
  const { getToken } = useAuth()
  const api = useMemo(() => createApiClient(getToken), [getToken])

  const [calendarTrades, setCalendarTrades] = useState<Trade[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [journals, setJournals] = useState<DailyJournal[]>([])
  const [loadingCalendarTrades, setLoadingCalendarTrades] = useState(false)
  const [loadingTrades, setLoadingTrades] = useState(false)
  const [loadingJournals, setLoadingJournals] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [journalNote, setJournalNote] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCalendarTrades = async () => {
    setLoadingCalendarTrades(true)
    setError(null)
    try {
      const tradeData = await api.getTrades({ pageNumber: 1, pageSize: 300 })
      setCalendarTrades(tradeData.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar trades.')
    } finally {
      setLoadingCalendarTrades(false)
    }
  }

  const loadJournals = async () => {
    setLoadingJournals(true)
    setError(null)
    try {
      const journalData = await api.getDailyJournals()
      setJournals(journalData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load journals.')
    } finally {
      setLoadingJournals(false)
    }
  }

  const loadTradesByDate = async (date: Date) => {
    setLoadingTrades(true)
    setError(null)
    try {
      const tradeData = await api.getTrades({
        pageNumber: 1,
        pageSize: 100,
        tradingDateUtc: toDayKey(date),
      })
      setTrades(tradeData.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades for selected day.')
    } finally {
      setLoadingTrades(false)
    }
  }

  useEffect(() => {
    void loadCalendarTrades()
    void loadJournals()
    void loadTradesByDate(selectedDate)
  }, [])

  const events = useMemo<CalendarTradeEvent[]>(
    () =>
      calendarTrades.map((trade) => {
        const openTime = new Date(trade.openTimeUtc)
        return {
          title: `${trade.ticker} (${trade.quantity})`,
          start: openTime,
          end: openTime,
          allDay: false,
          resource: trade,
        }
      }),
    [calendarTrades],
  )

  const selectedDayKey = toDayKey(selectedDate)
  const selectedJournalDatePart = toJournalIso(selectedDate).slice(0, 10)

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
    void loadTradesByDate(date)
    setDialogOpen(true)
  }

  const saveJournal = async () => {
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

  const loading = loadingCalendarTrades || loadingJournals || loadingTrades

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trade Calendar</h2>
        <Group gap="sm">
          <Badge variant="light">Selected day: {selectedDayKey}</Badge>
          <Button
            variant="default"
            size="xs"
            onClick={() => {
              void loadCalendarTrades()
              void loadJournals()
              void loadTradesByDate(selectedDate)
            }}
          >
            Refresh
          </Button>
        </Group>
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
          date={selectedDate}
          onNavigate={(date) => {
            setSelectedDate(date)
          }}
        />
      </div>

      <Dialog
        open={dialogOpen}
        title={`Daily Journal - ${selectedDate.toLocaleDateString()}`}
        onClose={() => setDialogOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">Trades of the day</h4>
            <div className="overflow-hidden rounded-md border border-slate-200">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ticker</Table.Th>
                    <Table.Th>Direction</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Open time</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {trades.map((trade) => (
                    <Table.Tr key={trade.id}>
                      <Table.Td>
                        {trade.ticker} <span className="text-xs text-slate-500">({trade.market})</span>
                      </Table.Td>
                      <Table.Td>{trade.direction === 1 ? 'Long' : 'Short'}</Table.Td>
                      <Table.Td>{trade.quantity}</Table.Td>
                      <Table.Td>{new Date(trade.openTimeUtc).toLocaleTimeString()}</Table.Td>
                    </Table.Tr>
                  ))}
                  {trades.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4} className="text-center text-slate-500">
                        No trades for this day.
                      </Table.Td>
                    </Table.Tr>
                  ) : null}
                </Table.Tbody>
              </Table>
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
