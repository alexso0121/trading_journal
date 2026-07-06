namespace trading_journel_app.Application.Features.Strategies.Images;

public sealed record CreateStrategyContentImageUploadUrlResponse(
    string StorageKey,
    string UploadUrl,
    string DownloadUrl,
    DateTime ExpiresAtUtc);