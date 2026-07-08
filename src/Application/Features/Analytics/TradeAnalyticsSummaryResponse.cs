using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.Analytics;

public sealed record TradeAnalyticsSymbolSummary(
    string Symbol,
    int TradeCount,
    decimal NetPnl);

public sealed record TradeAnalyticsSummaryResponse(
    int TotalTrades,
    int WinningTrades,
    int LosingTrades,
    decimal NetPnl,
    decimal AveragePnl,
    decimal BestTradePnl,
    decimal WorstTradePnl,
    decimal WinRatePercent,
    IReadOnlyCollection<TradeAnalyticsSymbolSummary> TopSymbols)
{
    public static TradeAnalyticsSummaryResponse FromTrades(IReadOnlyCollection<Trade> trades)
    {
        if (trades.Count == 0)
        {
            return new TradeAnalyticsSummaryResponse(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                []);
        }

        var totalTrades = trades.Count;
        var winningTrades = trades.Count(trade => trade.Pnl > 0);
        var losingTrades = trades.Count(trade => trade.Pnl < 0);
        var netPnl = trades.Sum(trade => trade.Pnl);
        var averagePnl = trades.Average(trade => trade.Pnl);
        var bestTradePnl = trades.Max(trade => trade.Pnl);
        var worstTradePnl = trades.Min(trade => trade.Pnl);
        var winRatePercent = totalTrades == 0 ? 0 : (decimal)winningTrades / totalTrades * 100m;

        var topSymbols = trades
            .GroupBy(trade => trade.Ticker)
            .Select(group => new TradeAnalyticsSymbolSummary(
                group.Key,
                group.Count(),
                group.Sum(trade => trade.Pnl)))
            .OrderByDescending(summary => summary.NetPnl)
            .ThenByDescending(summary => summary.TradeCount)
            .Take(5)
            .ToList();

        return new TradeAnalyticsSummaryResponse(
            totalTrades,
            winningTrades,
            losingTrades,
            netPnl,
            averagePnl,
            bestTradePnl,
            worstTradePnl,
            winRatePercent,
            topSymbols);
    }
}