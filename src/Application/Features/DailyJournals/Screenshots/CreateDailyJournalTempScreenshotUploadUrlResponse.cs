namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed record CreateDailyJournalTempScreenshotUploadUrlResponse(
    string StorageKey,
    string UploadUrl,
    string DownloadUrl,
    DateTime ExpiresAtUtc);