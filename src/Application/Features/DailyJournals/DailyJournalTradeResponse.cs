namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalTradeResponse(
    Guid Id,
    string Ticker,
    string Market,
    decimal EntryPrice,
    decimal Quantity,
    DateTime OpenTimeUtc);
