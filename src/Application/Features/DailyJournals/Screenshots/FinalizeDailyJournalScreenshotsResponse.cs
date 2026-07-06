namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed record FinalizeDailyJournalScreenshotsResponse(
    IReadOnlyCollection<FinalizeDailyJournalScreenshotItem> Items);

public sealed record FinalizeDailyJournalScreenshotItem(
    string TempStorageKey,
    string StorageKey,
    string DownloadUrl,
    DateTime ExpiresAtUtc);