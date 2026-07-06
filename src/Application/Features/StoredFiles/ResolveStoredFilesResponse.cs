namespace trading_journel_app.Application.Features.StoredFiles;

public sealed record ResolveStoredFilesResponse(IReadOnlyCollection<ResolveStoredFileItem> Items);

public sealed record ResolveStoredFileItem(
    Guid FileId,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
