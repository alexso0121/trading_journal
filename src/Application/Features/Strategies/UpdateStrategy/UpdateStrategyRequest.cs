namespace trading_journel_app.Application.Strategies.UpdateStrategy;

public sealed class UpdateStrategyRequest
{
    public int LastKnownVersion { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IReadOnlyCollection<string> Tags { get; init; } = [];
}
