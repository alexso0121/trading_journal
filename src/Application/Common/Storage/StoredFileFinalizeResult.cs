namespace trading_journel_app.Application.Common.Storage;

public sealed record StoredFileFinalizeResult(
    string TempStorageKey,
    string StorageKey,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
