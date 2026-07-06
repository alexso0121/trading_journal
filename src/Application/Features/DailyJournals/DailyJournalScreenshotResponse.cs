using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalScreenshotResponse(
    Guid Id,
    string StorageKey,
    string FileName,
    string ContentType,
    string DownloadUrl,
    DateTime ExpiresAtUtc,
    DateTime CreatedAtUtc)
{
    public static DailyJournalScreenshotResponse FromEntity(DailyJournalScreenshot screenshot) =>
        new(
            screenshot.Id,
            screenshot.StorageKey,
            screenshot.FileName,
            screenshot.ContentType,
            screenshot.DownloadUrl,
            screenshot.ExpiresAtUtc,
            screenshot.CreatedAtUtc);
}