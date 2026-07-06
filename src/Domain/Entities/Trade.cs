using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Domain.Entities;

public sealed class Trade
{
    private Trade()
    {
    }

    private Trade(
        Guid strategyId,
        Guid userId,
        string ticker,
        string market,
        TradeAsset asset,
        TradeDirection direction,
        decimal entryPrice,
        decimal quantity,
        decimal pnl,
        string comments,
        DateTime openTimeUtc)
    {
        Id = Guid.NewGuid();
        StrategyId = strategyId;
        UserId = userId;
        Ticker = ticker.Trim().ToUpperInvariant();
        Market = market.Trim();
        Asset = asset;
        Direction = direction;
        EntryPrice = entryPrice;
        Quantity = quantity;
        Pnl = pnl;
        Comments = comments.Trim();
        OpenTimeUtc = openTimeUtc;
        Status = TradeStatus.Open;
        Version = 1;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid StrategyId { get; private set; }
    public Guid UserId { get; private set; }
    public string Ticker { get; private set; } = string.Empty;
    public string Market { get; private set; } = string.Empty;
    public TradeAsset Asset { get; private set; }
    public TradeDirection Direction { get; private set; }
    public TradeStatus Status { get; private set; }
    public decimal EntryPrice { get; private set; }
    public decimal Quantity { get; private set; }
    public decimal Pnl { get; private set; }
    public string Comments { get; private set; } = string.Empty;
    public DateTime OpenTimeUtc { get; private set; }
    public DateTime? CloseTimeUtc { get; private set; }
    public int Version { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public Strategy Strategy { get; private set; } = null!;

    public static Trade Create(
        Guid strategyId,
        Guid userId,
        string ticker,
        string market,
        TradeAsset asset,
        TradeDirection direction,
        decimal entryPrice,
        decimal quantity,
        decimal pnl,
        string comments,
        DateTime openTimeUtc)
    {
        if (strategyId == Guid.Empty) throw new ArgumentException("StrategyId is required.", nameof(strategyId));
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(ticker)) throw new ArgumentException("Ticker is required.", nameof(ticker));
        if (string.IsNullOrWhiteSpace(market)) throw new ArgumentException("Market is required.", nameof(market));
        if (!Enum.IsDefined(asset)) throw new ArgumentOutOfRangeException(nameof(asset), "Asset is invalid.");
        if (entryPrice <= 0) throw new ArgumentOutOfRangeException(nameof(entryPrice), "EntryPrice must be greater than zero.");
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");

        return new Trade(strategyId, userId, ticker, market, asset, direction, entryPrice, quantity, pnl, comments, openTimeUtc);
    }

    public void Update(
        Guid strategyId,
        string ticker,
        string market,
        TradeAsset asset,
        TradeDirection direction,
        TradeStatus status,
        decimal entryPrice,
        decimal quantity,
        decimal pnl,
        string comments,
        DateTime openTimeUtc,
        DateTime? closeTimeUtc)
    {
        if (strategyId == Guid.Empty) throw new ArgumentException("StrategyId is required.", nameof(strategyId));
        if (string.IsNullOrWhiteSpace(ticker)) throw new ArgumentException("Ticker is required.", nameof(ticker));
        if (string.IsNullOrWhiteSpace(market)) throw new ArgumentException("Market is required.", nameof(market));
        if (!Enum.IsDefined(asset)) throw new ArgumentOutOfRangeException(nameof(asset), "Asset is invalid.");
        if (entryPrice <= 0) throw new ArgumentOutOfRangeException(nameof(entryPrice), "EntryPrice must be greater than zero.");
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        if (closeTimeUtc.HasValue && closeTimeUtc.Value < openTimeUtc)
            throw new ArgumentOutOfRangeException(nameof(closeTimeUtc), "CloseTimeUtc cannot be earlier than OpenTimeUtc.");

        StrategyId = strategyId;
        Ticker = ticker.Trim().ToUpperInvariant();
        Market = market.Trim();
        Asset = asset;
        Direction = direction;
        Status = status;
        EntryPrice = entryPrice;
        Quantity = quantity;
        Pnl = pnl;
        Comments = comments.Trim();
        OpenTimeUtc = openTimeUtc;
        CloseTimeUtc = closeTimeUtc;
        Version += 1;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
