using trading_journel_app.Domain.Entities;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Trades;

public sealed record TradeResponse(
    Guid Id,
    Guid StrategyId,
    Guid UserId,
    string Ticker,
    string Market,
    TradeDirection Direction,
    TradeStatus Status,
    decimal EntryPrice,
    decimal Quantity,
    DateTime OpenTimeUtc,
    DateTime? CloseTimeUtc,
    int Version,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc)
{
    public static TradeResponse FromEntity(Trade trade) =>
        new(
            trade.Id,
            trade.StrategyId,
            trade.UserId,
            trade.Ticker,
            trade.Market,
            trade.Direction,
            trade.Status,
            trade.EntryPrice,
            trade.Quantity,
            trade.OpenTimeUtc,
            trade.CloseTimeUtc,
            trade.Version,
            trade.CreatedAtUtc,
            trade.UpdatedAtUtc);
}
