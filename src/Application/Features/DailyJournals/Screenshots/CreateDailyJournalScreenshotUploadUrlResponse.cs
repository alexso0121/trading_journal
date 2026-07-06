namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed record CreateDailyJournalScreenshotUploadUrlResponse(
    string StorageKey,
    string UploadUrl,
    string DownloadUrl,
    DateTime ExpiresAtUtc);