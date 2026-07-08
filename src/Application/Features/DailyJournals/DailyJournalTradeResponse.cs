using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalTradeResponse(
    string Symbol,
    decimal Pnl)
{
    public static DailyJournalTradeResponse FromEntity(Trade trade) =>
        new(
            trade.Ticker,
            trade.Pnl);
}
