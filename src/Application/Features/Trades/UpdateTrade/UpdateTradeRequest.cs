using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Trades.UpdateTrade;

public sealed class UpdateTradeRequest
{
    public Guid StrategyId { get; init; }
    public string Ticker { get; init; } = string.Empty;
    public string Market { get; init; } = string.Empty;
    public TradeDirection Direction { get; init; }
    public TradeStatus Status { get; init; }
    public decimal EntryPrice { get; init; }
    public decimal Quantity { get; init; }
    public DateTime OpenTimeUtc { get; init; }
    public DateTime? CloseTimeUtc { get; init; }
    public int LastKnownVersion { get; init; }
}
