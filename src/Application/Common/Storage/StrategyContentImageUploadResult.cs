namespace trading_journel_app.Application.Common.Storage;

public sealed record StrategyContentImageUploadResult(
    string StorageKey,
    string UploadUrl,
    string DownloadUrl,
    DateTime ExpiresAtUtc);