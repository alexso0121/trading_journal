using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Strategies;

public sealed record StrategyTagResponse(Guid Id, string Name)
{
    public static StrategyTagResponse FromEntity(StrategyTag tag) => new(tag.Id, tag.Name);
}