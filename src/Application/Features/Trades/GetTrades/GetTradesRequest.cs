namespace trading_journel_app.Application.Trades;

public sealed record GetTradesRequest(
    int PageNumber = 1,
    int PageSize = 20,
    Guid? StrategyId = null,
    DateTime? TradingDateUtc = null,
    DateTime? StartDateUtc = null,
    DateTime? EndDateUtc = null);
