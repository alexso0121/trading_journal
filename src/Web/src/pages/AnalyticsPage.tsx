import { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../lib/apiClient';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import type { TradeAnalyticsSummary } from '../types/models';

const emptySummary: TradeAnalyticsSummary = {
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  netPnl: 0,
  averagePnl: 0,
  bestTradePnl: 0,
  worstTradePnl: 0,
  winRatePercent: 0,
  topSymbols: [],
};

const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export const AnalyticsPage = () => {
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);
  const toast = useToast();

  const [summary, setSummary] = useState<TradeAnalyticsSummary>(emptySummary);
  const [startDateUtc, setStartDateUtc] = useState('');
  const [endDateUtc, setEndDateUtc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, 'Analytics');
    setError(null);
  }, [error, toast]);

  const loadSummary = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getTradeAnalyticsSummary({
        startDateUtc: startDate || undefined,
        endDateUtc: endDate || undefined,
      });
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          onClick={() => {
            void loadSummary(startDateUtc, endDateUtc);
          }}
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Start date (UTC)</span>
          <input
            type="date"
            value={startDateUtc}
            onChange={(event) => setStartDateUtc(event.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">End date (UTC)</span>
          <input
            type="date"
            value={endDateUtc}
            onChange={(event) => setEndDateUtc(event.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5"
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-2">
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            onClick={() => {
              void loadSummary(startDateUtc, endDateUtc);
            }}
          >
            Apply range
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            onClick={() => {
              setStartDateUtc('');
              setEndDateUtc('');
              void loadSummary();
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Trades</p>
          <p className="mt-1 text-2xl font-semibold">{summary.totalTrades}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Net PnL</p>
          <p className="mt-1 text-2xl font-semibold">{formatDecimal(summary.netPnl)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Win Rate</p>
          <p className="mt-1 text-2xl font-semibold">{formatDecimal(summary.winRatePercent)}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average PnL</p>
          <p className="mt-1 text-2xl font-semibold">{formatDecimal(summary.averagePnl)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Winning Trades</p>
          <p className="mt-1 text-xl font-semibold">{summary.winningTrades}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Losing Trades</p>
          <p className="mt-1 text-xl font-semibold">{summary.losingTrades}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Best / Worst</p>
          <p className="mt-1 text-xl font-semibold">
            {formatDecimal(summary.bestTradePnl)} / {formatDecimal(summary.worstTradePnl)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
          Top Symbols
        </div>
        {summary.topSymbols.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">No trades in selected range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Trades</th>
                <th className="px-4 py-2">Net PnL</th>
              </tr>
            </thead>
            <tbody>
              {summary.topSymbols.map((item) => (
                <tr key={item.symbol} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{item.symbol}</td>
                  <td className="px-4 py-2">{item.tradeCount}</td>
                  <td className="px-4 py-2">{formatDecimal(item.netPnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};