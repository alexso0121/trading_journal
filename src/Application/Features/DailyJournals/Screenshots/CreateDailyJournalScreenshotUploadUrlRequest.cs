namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed class CreateDailyJournalScreenshotUploadUrlRequest
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
}