namespace trading_journel_app.Application.Common.Storage;

public sealed record StoredFileUploadResult(
    string StorageKey,
    string UploadUrl,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
