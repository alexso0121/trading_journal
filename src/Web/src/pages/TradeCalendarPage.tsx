import { format, parse, startOfWeek, getDay, endOfMonth, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Group, Table } from '@mantine/core';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  CreateTradeDialog,
  emptyTradeCreateForm,
  type TradeCreateFormState,
} from '../components/CreateTradeDialog';
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

const replaceUrls = (value: string, mapping: Map<string, string>) => {
  let result = value;
  for (const [from, to] of mapping.entries()) {
    if (!from || from === to) {
      continue;
    }

    result = result.split(from).join(to);
  }

  return result;
};

const hasRichTextContent = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, '')
    .length > 0;

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
  const suppressNextSlotSelectionRef = useRef(false);
  const tempImageUrlByStorageKeyRef = useRef<Map<string, string>>(new Map());
  const [pendingTempStorageKeys, setPendingTempStorageKeys] = useState<string[]>([]);

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
    tempImageUrlByStorageKeyRef.current.clear();
    setPendingTempStorageKeys([]);
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
    if (!hasRichTextContent(journalTradeIdea) && !hasRichTextContent(journalReflection)) {
      setError('TradeIdea or Reflection is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const basePayload = {
        journalDateUtc: toJournalIso(selectedDate),
        tradeIdea: journalTradeIdea,
        reflection: journalReflection,
      };

      let journal: DailyJournal;

      if (existingJournal) {
        journal = await api.updateDailyJournal(existingJournal.id, basePayload);
      } else {
        journal = await api.createDailyJournal(basePayload);
      }

      let finalJournal = journal;

      if (pendingTempStorageKeys.length > 0) {
        const finalizeResponse = await api.finalizeDailyJournalScreenshots(journal.id, {
          storageKeys: pendingTempStorageKeys,
        });

        const urlMapping = new Map<string, string>();
        for (const item of finalizeResponse.items) {
          const tempUrl = tempImageUrlByStorageKeyRef.current.get(item.tempStorageKey);
          if (tempUrl) {
            urlMapping.set(tempUrl, item.downloadUrl);
          }
        }

        if (urlMapping.size > 0) {
          const finalizedTradeIdea = replaceUrls(basePayload.tradeIdea, urlMapping);
          const finalizedReflection = replaceUrls(basePayload.reflection, urlMapping);

          finalJournal = await api.updateDailyJournal(journal.id, {
            journalDateUtc: basePayload.journalDateUtc,
            tradeIdea: finalizedTradeIdea,
            reflection: finalizedReflection,
          });

          setJournalTradeIdea(finalizedTradeIdea);
          setJournalReflection(finalizedReflection);
        }

        setPendingTempStorageKeys([]);
        tempImageUrlByStorageKeyRef.current.clear();
      }

      setJournals((prev) => {
        const index = prev.findIndex((item) => item.id === finalJournal.id);
        if (index >= 0) {
          var next = [...prev];
          next[index] = finalJournal;
          return next;
        }

        return [finalJournal, ...prev];
      });

      setDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save daily journal.');
    } finally {
      setSaving(false);
    }
  };

  const uploadEditorImage = async (file: File): Promise<string> => {
    const uploadInfo = await api.createDailyJournalTempScreenshotUploadUrl({
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    tempImageUrlByStorageKeyRef.current.set(uploadInfo.storageKey, uploadInfo.downloadUrl);
    setPendingTempStorageKeys((prev) => {
      if (prev.includes(uploadInfo.storageKey)) {
        return prev;
      }

      return [...prev, uploadInfo.storageKey];
    });

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
          views={['month']} // Only show Month
          style={{ height: 680 }}
          onSelectSlot={(slotInfo) => {
            if (suppressNextSlotSelectionRef.current) {
              suppressNextSlotSelectionRef.current = false;
              return;
            }

            openDayDialog(slotInfo.start);
          }}
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
                      event.preventDefault();
                      event.stopPropagation();
                      suppressNextSlotSelectionRef.current = true;

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

      <CreateTradeDialog
        open={createTradeOpen}
        title={`Create trade - ${selectedDate.toLocaleDateString()}`}
        strategies={strategies}
        form={createTradeForm}
        creating={creatingTrade}
        onChange={(updater) => {
          setCreateTradeForm((prev) => updater(prev));
        }}
        onClose={() => {
          setCreateTradeOpen(false);
        }}
        onSave={() => {
          void createTrade();
        }}
      />

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
