namespace trading_journel_app.Application.Strategies.CreateStrategy;

public sealed class CreateStrategyRequest
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IReadOnlyCollection<string> Tags { get; init; } = [];
}
