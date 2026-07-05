namespace trading_journel_app.Application.Strategies;

public sealed record StrategyTradeResponse(
    Guid Id,
    string Ticker,
    string Market,
    decimal EntryPrice,
    decimal Quantity,
    int Version,
    DateTime OpenTimeUtc);
