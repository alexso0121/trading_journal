using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Trades.CreateTrade;

public sealed class CreateTradeRequest
{
    public Guid StrategyId { get; init; }
    public string Ticker { get; init; } = string.Empty;
    public string Market { get; init; } = string.Empty;
    public TradeAsset Asset { get; init; }
    public TradeDirection Direction { get; init; }
    public decimal EntryPrice { get; init; }
    public decimal Quantity { get; init; }
    public decimal Pnl { get; init; }
    public string Comments { get; init; } = string.Empty;
    public DateTime OpenTimeUtc { get; init; }
}
