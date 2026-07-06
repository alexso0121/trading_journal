import { format, parse, startOfWeek, getDay, endOfMonth, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Group, Table } from '@mantine/core';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog } from '../components/Dialog';
import { StrategyRichTextEditor } from '../components/StrategyRichTextEditor';
import { createApiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import type { DailyJournal, Strategy, Trade } from '../types/models';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarTradeEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay: false;
  resource: Trade;
};

const toDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toJournalIso = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();

const toDateTimeLocal = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const normalizeCalendarRange = (
  range: Date[] | { start: Date; end: Date } | undefined,
  fallbackDate: Date
) => {
  if (Array.isArray(range) && range.length > 0) {
    return {
      start: range[0],
      end: range[range.length - 1],
    };
  }

  if (range && 'start' in range && 'end' in range) {
    return {
      start: range.start,
      end: range.end,
    };
  }

  return {
    start: startOfMonth(fallbackDate),
    end: endOfMonth(fallbackDate),
  };
};

type TradeCreateFormState = {
  strategyId: string;
  ticker: string;
  market: string;
  asset: number;
  direction: number;
  entryPrice: string;
  quantity: string;
  pnl: string;
  comments: string;
  openTimeUtc: string;
};

const emptyTradeCreateForm: TradeCreateFormState = {
  strategyId: '',
  ticker: '',
  market: '',
  asset: 1,
  direction: 1,
  entryPrice: '',
  quantity: '',
  pnl: '0',
  comments: '',
  openTimeUtc: '',
};

export const TradeCalendarPage = () => {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const [calendarTrades, setCalendarTrades] = useState<Trade[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journals, setJournals] = useState<DailyJournal[]>([]);
  const [loadingCalendarTrades, setLoadingCalendarTrades] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createTradeOpen, setCreateTradeOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [createTradeForm, setCreateTradeForm] =
    useState<TradeCreateFormState>(emptyTradeCreateForm);
  const [creatingTrade, setCreatingTrade] = useState(false);
  const [calendarRange, setCalendarRange] = useState(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }));
  const [journalTradeIdea, setJournalTradeIdea] = useState('');
  const [journalReflection, setJournalReflection] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCalendarTrades = async (rangeStart: Date, rangeEnd: Date) => {
    setLoadingCalendarTrades(true);
    setError(null);
    try {
      const tradeData = await api.getTrades({
        pageNumber: 1,
        pageSize: 200,
        startDateUtc: toDayKey(rangeStart),
        endDateUtc: toDayKey(rangeEnd),
      });
      setCalendarTrades(tradeData.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar trades.');
    } finally {
      setLoadingCalendarTrades(false);
    }
  };

  const loadJournals = async () => {
    setLoadingJournals(true);
    setError(null);
    try {
      const journalData = await api.getDailyJournals();
      setJournals(journalData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load journals.');
    } finally {
      setLoadingJournals(false);
    }
  };

  const loadStrategies = async () => {
    try {
      const strategyData = await api.getStrategies({ pageNumber: 1, pageSize: 100 });
      setStrategies(strategyData.items);
      if (strategyData.items.length > 0) {
        setCreateTradeForm((prev) => ({
          ...prev,
          strategyId: prev.strategyId || strategyData.items[0].id,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load strategies.');
    }
  };

  const loadTradesByDate = async (date: Date) => {
    setLoadingTrades(true);
    setError(null);
    try {
      const tradeData = await api.getTrades({
        pageNumber: 1,
        pageSize: 100,
        tradingDateUtc: toDayKey(date),
      });
      setTrades(tradeData.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades for selected day.');
    } finally {
      setLoadingTrades(false);
    }
  };

  useEffect(() => {
    void loadCalendarTrades(calendarRange.start, calendarRange.end);
    void loadJournals();
    void loadTradesByDate(selectedDate);
    void loadStrategies();
  }, []);

  const events = useMemo<CalendarTradeEvent[]>(
    () =>
      calendarTrades.map((trade) => {
        const openTime = new Date(trade.openTimeUtc);
        return {
          title: `${trade.ticker} (${trade.quantity})`,
          start: openTime,
          end: openTime,
          allDay: false,
          resource: trade,
        };
      }),
    [calendarTrades]
  );

  const selectedDayKey = toDayKey(selectedDate);
  const selectedJournalDatePart = toJournalIso(selectedDate).slice(0, 10);

  const existingJournal = useMemo(() => {
    if (!selectedJournalDatePart) {
      return null;
    }
    return (
      journals.find((journal) => journal.journalDateUtc.slice(0, 10) === selectedJournalDatePart) ??
      null
    );
  }, [journals, selectedJournalDatePart]);

  useEffect(() => {
    setJournalTradeIdea(existingJournal?.tradeIdea ?? existingJournal?.note ?? '');
    setJournalReflection(existingJournal?.reflection ?? '');
  }, [existingJournal]);

  const openDayDialog = (date: Date) => {
    setSelectedDate(date);
    void loadTradesByDate(date);
    setDialogOpen(true);
  };

  const openCreateTradeDialog = (date: Date) => {
    setSelectedDate(date);
    setCreateTradeForm((prev) => ({
      ...prev,
      openTimeUtc: toDateTimeLocal(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 30)
      ),
    }));
    setCreateTradeOpen(true);
  };

  const createTrade = async () => {
    if (
      !createTradeForm.strategyId ||
      !createTradeForm.ticker.trim() ||
      !createTradeForm.market.trim() ||
      !createTradeForm.entryPrice ||
      !createTradeForm.quantity ||
      !createTradeForm.openTimeUtc
    ) {
      setError('Please complete all required trade fields.');
      return;
    }

    setCreatingTrade(true);
    setError(null);
    try {
      await api.createTrade({
        strategyId: createTradeForm.strategyId,
        ticker: createTradeForm.ticker.trim(),
        market: createTradeForm.market.trim(),
        asset: createTradeForm.asset,
        direction: createTradeForm.direction,
        entryPrice: Number(createTradeForm.entryPrice),
        quantity: Number(createTradeForm.quantity),
        pnl: Number(createTradeForm.pnl || 0),
        comments: createTradeForm.comments,
        openTimeUtc: new Date(createTradeForm.openTimeUtc).toISOString(),
      });

      setCreateTradeOpen(false);
      setCreateTradeForm((prev) => ({
        ...emptyTradeCreateForm,
        strategyId: prev.strategyId,
      }));

      await Promise.all([
        loadCalendarTrades(calendarRange.start, calendarRange.end),
        loadTradesByDate(selectedDate),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create trade.');
    } finally {
      setCreatingTrade(false);
    }
  };

  const saveJournal = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        journalDateUtc: toJournalIso(selectedDate),
        tradeIdea: journalTradeIdea,
        reflection: journalReflection,
      };

      if (existingJournal) {
        const updated = await api.updateDailyJournal(existingJournal.id, payload);
        setJournals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createDailyJournal(payload);
        setJournals((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save daily journal.');
    } finally {
      setSaving(false);
    }
  };

  const uploadEditorImage = async (file: File): Promise<string> => {
    let journalId = existingJournal?.id;

    if (!journalId) {
      const created = await api.createDailyJournal({
        journalDateUtc: toJournalIso(selectedDate),
        tradeIdea: journalTradeIdea,
        reflection: journalReflection,
      });

      setJournals((prev) => [created, ...prev]);
      journalId = created.id;
    }

    const uploadInfo = await api.createDailyJournalScreenshotUploadUrl(journalId, {
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    await loadJournals();
    return uploadInfo.downloadUrl;
  };

  const loading = loadingCalendarTrades || loadingJournals || loadingTrades;

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
              void loadCalendarTrades(calendarRange.start, calendarRange.end);
              void loadJournals();
              void loadTradesByDate(selectedDate);
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
          components={{
            month: {
              dateHeader: ({ date }) => (
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    className="text-xs text-slate-700 hover:underline"
                    onClick={() => openDayDialog(date)}
                  >
                    {date.getDate()}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-1 text-[10px] leading-4 text-slate-700 hover:bg-slate-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      openCreateTradeDialog(date);
                    }}
                    title="Create trade"
                    aria-label="Create trade"
                  >
                    +
                  </button>
                </div>
              ),
            },
          }}
          date={selectedDate}
          onNavigate={(date) => {
            setSelectedDate(date);
          }}
          onRangeChange={(range) => {
            const next = normalizeCalendarRange(range, selectedDate);
            setCalendarRange(next);
            void loadCalendarTrades(next.start, next.end);
          }}
        />
      </div>

      <Dialog
        open={createTradeOpen}
        title={`Create trade - ${selectedDate.toLocaleDateString()}`}
        onClose={() => {
          setCreateTradeOpen(false);
        }}
      >
        <div className="grid gap-2 md:grid-cols-2">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createTradeForm.strategyId}
            onChange={(e) =>
              setCreateTradeForm((prev) => ({ ...prev, strategyId: e.target.value }))
            }
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
            value={createTradeForm.ticker}
            onChange={(e) => setCreateTradeForm((prev) => ({ ...prev, ticker: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Market"
            value={createTradeForm.market}
            onChange={(e) => setCreateTradeForm((prev) => ({ ...prev, market: e.target.value }))}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createTradeForm.asset}
            onChange={(e) =>
              setCreateTradeForm((prev) => ({ ...prev, asset: Number(e.target.value) }))
            }
          >
            <option value={1}>Stock</option>
            <option value={2}>Future</option>
            <option value={3}>Contract</option>
            <option value={4}>Crypto</option>
            <option value={5}>Forex</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={createTradeForm.direction}
            onChange={(e) =>
              setCreateTradeForm((prev) => ({ ...prev, direction: Number(e.target.value) }))
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
            value={createTradeForm.entryPrice}
            onChange={(e) =>
              setCreateTradeForm((prev) => ({ ...prev, entryPrice: e.target.value }))
            }
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="Quantity"
            value={createTradeForm.quantity}
            onChange={(e) => setCreateTradeForm((prev) => ({ ...prev, quantity: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="number"
            step="0.000001"
            placeholder="PnL"
            value={createTradeForm.pnl}
            onChange={(e) => setCreateTradeForm((prev) => ({ ...prev, pnl: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="datetime-local"
            value={createTradeForm.openTimeUtc}
            onChange={(e) =>
              setCreateTradeForm((prev) => ({ ...prev, openTimeUtc: e.target.value }))
            }
          />
          <textarea
            className="md:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Comments"
            value={createTradeForm.comments}
            onChange={(e) => setCreateTradeForm((prev) => ({ ...prev, comments: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={() => {
              void createTrade();
            }}
            disabled={creatingTrade}
          >
            {creatingTrade ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Dialog>

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
                        {trade.ticker}{' '}
                        <span className="text-xs text-slate-500">({trade.market})</span>
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
            <h4 className="mb-2 font-medium">Trade idea</h4>
            <StrategyRichTextEditor
              value={journalTradeIdea}
              onChange={setJournalTradeIdea}
              onImageUpload={uploadEditorImage}
              placeholder="Rich text trade idea"
            />
          </div>

          <div>
            <h4 className="mb-2 font-medium">Reflection</h4>
            <StrategyRichTextEditor
              value={journalReflection}
              onChange={setJournalReflection}
              onImageUpload={uploadEditorImage}
              placeholder="Rich text reflection"
            />
          </div>

          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={saving}
            onClick={() => {
              void saveJournal();
            }}
          >
            {existingJournal ? 'Update journal' : 'Save journal'}
          </button>
        </div>
      </Dialog>
    </section>
  );
};
