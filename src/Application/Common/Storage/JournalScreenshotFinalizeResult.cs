namespace trading_journel_app.Application.Common.Storage;

public sealed record JournalScreenshotFinalizeResult(
    string TempStorageKey,
    string StorageKey,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
