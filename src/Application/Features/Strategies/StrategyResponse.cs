using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Strategies;

public sealed record StrategyResponse(
    Guid Id,
    Guid UserId,
    string Name,
    string Description,
    int Version,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyCollection<StrategyTagResponse> Tags,
    IReadOnlyCollection<StrategyTradeResponse> Trades)
{
    public static StrategyResponse FromEntity(Strategy strategy) =>
        new(
            strategy.Id,
            strategy.UserId,
            strategy.Name,
            strategy.Description,
            strategy.Version,
            strategy.CreatedAtUtc,
            strategy.UpdatedAtUtc,
            strategy.Tags
                .OrderBy(t => t.Name)
                .Select(StrategyTagResponse.FromEntity)
                .ToList(),
            strategy.Trades
                .OrderByDescending(t => t.OpenTimeUtc)
                .Select(t => new StrategyTradeResponse(
                    t.Id,
                    t.Ticker,
                    t.Market,
                    t.EntryPrice,
                    t.Quantity,
                    t.Version,
                    t.OpenTimeUtc))
                .ToList());
}
