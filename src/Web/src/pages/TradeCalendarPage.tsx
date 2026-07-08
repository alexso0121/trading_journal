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
import { useToast } from '../components/ToastProvider';
import { createApiClient } from '../lib/apiClient';
import {
  extractStoredFileIds,
  normalizeStoredFileContentForSave,
  resolveStoredFileContent,
} from '../lib/storedFileContent';
import { useAuth } from '../providers/AuthProvider';
import type { ChecklistConfigItem, DailyJournalDetail, Strategy, Trade } from '../types/models';

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

type JournalChecklistItemState = {
  configItemId: string | null;
  label: string;
  sequence: number;
  isChecked: boolean;
};

const toDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toJournalIso = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();

const hasRichTextContent = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, '').length > 0;

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
  const toast = useToast();

  const [calendarTrades, setCalendarTrades] = useState<Trade[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<DailyJournalDetail | null>(null);
  const [checklistConfig, setChecklistConfig] = useState<ChecklistConfigItem[]>([]);
  const [loadingCalendarTrades, setLoadingCalendarTrades] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [loadingJournal, setLoadingJournal] = useState(false);
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
  const [journalChecklistItems, setJournalChecklistItems] = useState<JournalChecklistItemState[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const suppressNextSlotSelectionRef = useRef(false);
  const [pendingJournalFileIds, setPendingJournalFileIds] = useState<string[]>([]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, 'Calendar');
    setError(null);
  }, [error, toast]);

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

  const loadJournalByDate = async (date: Date) => {
    setLoadingJournal(true);
    setError(null);
    try {
      const journal = await api.getDailyJournalDetail({ dateUtc: toDayKey(date) });
      setSelectedJournal(journal);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load journal for selected day.');
    } finally {
      setLoadingJournal(false);
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

  const loadChecklistConfig = async () => {
    try {
      const checklistItems = await api.getChecklistSettings();
      setChecklistConfig(checklistItems.sort((a, b) => a.sequence - b.sequence));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load checklist settings.');
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
    void loadTradesByDate(selectedDate);
    void loadJournalByDate(selectedDate);
    void loadStrategies();
    void loadChecklistConfig();
  }, []);

  const events = useMemo<CalendarTradeEvent[]>(
    () =>
      calendarTrades.map((trade) => {
        const openTime = new Date(trade.openTimeUtc);
        const pnlSymbol = trade.pnl >= 0 ? '+' : '-';
        return {
          title: `${trade.ticker} (${pnlSymbol}${Math.abs(trade.pnl)})`,
          start: openTime,
          end: openTime,
          allDay: false,
          resource: trade,
        };
      }),
    [calendarTrades]
  );

  const selectedDayKey = toDayKey(selectedDate);

  useEffect(() => {
    let cancelled = false;

    const loadJournalContent = async () => {
      const nextTradeIdea = selectedJournal?.tradeIdea ?? selectedJournal?.note ?? '';
      const nextReflection = selectedJournal?.reflection ?? '';

      const nextChecklistItems = selectedJournal?.checklistItems?.length
        ? selectedJournal.checklistItems
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((item) => ({
              configItemId: item.configItemId,
              label: item.label,
              sequence: item.sequence,
              isChecked: item.isChecked,
            }))
        : checklistConfig
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((item) => ({
              configItemId: item.id,
              label: item.label,
              sequence: item.sequence,
              isChecked: false,
            }));
      const fileIds = [
        ...new Set([
          ...extractStoredFileIds(nextTradeIdea),
          ...extractStoredFileIds(nextReflection),
        ]),
      ];

      if (fileIds.length === 0) {
        if (!cancelled) {
          setJournalTradeIdea(nextTradeIdea);
          setJournalReflection(nextReflection);
          setJournalChecklistItems(nextChecklistItems);
        }
        return;
      }

      try {
        const resolved = await api.resolveStoredFiles({ fileIds });
        const resolvedUrls = new Map(
          resolved.items.map((item) => [item.fileId, item.downloadUrl] as const)
        );

        if (!cancelled) {
          setJournalTradeIdea(resolveStoredFileContent(nextTradeIdea, resolvedUrls));
          setJournalReflection(resolveStoredFileContent(nextReflection, resolvedUrls));
          setJournalChecklistItems(nextChecklistItems);
        }
      } catch {
        if (!cancelled) {
          setJournalTradeIdea(nextTradeIdea);
          setJournalReflection(nextReflection);
          setJournalChecklistItems(nextChecklistItems);
        }
      }
    };

    setPendingJournalFileIds([]);
    void loadJournalContent();

    return () => {
      cancelled = true;
    };
  }, [api, checklistConfig, selectedJournal]);

  const openDayDialog = (date: Date) => {
    setSelectedDate(date);
    void loadTradesByDate(date);
    void loadJournalByDate(date);
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
    if (
      !hasRichTextContent(journalTradeIdea) &&
      !hasRichTextContent(journalReflection) &&
      journalChecklistItems.length === 0
    ) {
      setError('TradeIdea, Reflection, or Checklist is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const basePayload = {
        journalDateUtc: toJournalIso(selectedDate),
        tradeIdea: normalizeStoredFileContentForSave(journalTradeIdea),
        reflection: normalizeStoredFileContentForSave(journalReflection),
        checklistItems: journalChecklistItems
          .slice()
          .sort((a, b) => a.sequence - b.sequence)
          .map((item) => ({
            configItemId: item.configItemId,
            label: item.label,
            sequence: item.sequence,
            isChecked: item.isChecked,
          })),
      };

      const journal = selectedJournal
        ? await api.updateDailyJournal(selectedJournal.id, basePayload)
        : await api.createDailyJournal(basePayload);

      if (pendingJournalFileIds.length > 0) {
        await api.finalizeDailyJournalFiles(journal.id, {
          fileIds: pendingJournalFileIds,
        });
      }
      setPendingJournalFileIds([]);

      setSelectedJournal((previous) => ({
        ...journal,
        trades: previous?.trades ?? [],
      }));

      setDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save daily journal.');
    } finally {
      setSaving(false);
    }
  };

  const uploadEditorImage = async (file: File): Promise<{ src: string; fileId: string }> => {
    const uploadInfo = await api.createDailyJournalTempFileUploadUrl({
      fileName: file.name,
      contentType: file.type,
    });

    await api.uploadFileToPresignedUrl(uploadInfo.uploadUrl, file);
    setPendingJournalFileIds((prev) => {
      if (prev.includes(uploadInfo.fileId)) {
        return prev;
      }

      return [...prev, uploadInfo.fileId];
    });

    return { src: uploadInfo.downloadUrl, fileId: uploadInfo.fileId };
  };

  const loading = loadingCalendarTrades || loadingJournal || loadingTrades;

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
              void loadTradesByDate(selectedDate);
              void loadJournalByDate(selectedDate);
              void loadChecklistConfig();
            }}
          >
            Refresh
          </Button>
        </Group>
      </div>

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
            <h4 className="mb-2 font-medium">Checklist</h4>
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              {journalChecklistItems.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No checklist items configured. Add them in Settings.
                </p>
              ) : (
                journalChecklistItems
                  .slice()
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((item, index) => (
                    <label
                      key={`${item.configItemId ?? 'snapshot'}-${item.sequence}-${index}`}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={item.isChecked}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setJournalChecklistItems((previous) =>
                            previous.map((candidate) =>
                              candidate.sequence === item.sequence && candidate.label === item.label
                                ? { ...candidate, isChecked: checked }
                                : candidate
                            )
                          );
                        }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))
              )}
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
            {selectedJournal ? 'Update journal' : 'Save journal'}
          </button>
        </div>
      </Dialog>
    </section>
  );
};
