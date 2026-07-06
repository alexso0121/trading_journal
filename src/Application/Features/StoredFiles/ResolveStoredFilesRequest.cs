namespace trading_journel_app.Application.Features.StoredFiles;

public sealed class ResolveStoredFilesRequest
{
    public IReadOnlyCollection<Guid> FileIds { get; init; } = [];
}
