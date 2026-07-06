namespace trading_journel_app.Application.Features.Strategies.Files;

public sealed class FinalizeStrategyFilesRequest
{
    public IReadOnlyCollection<Guid> FileIds { get; init; } = [];
}
