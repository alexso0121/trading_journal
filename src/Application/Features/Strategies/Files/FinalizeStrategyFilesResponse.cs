namespace trading_journel_app.Application.Features.Strategies.Files;

public sealed record FinalizeStrategyFilesResponse(IReadOnlyCollection<FinalizeStrategyFileItem> Items);

public sealed record FinalizeStrategyFileItem(
    Guid FileId,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
