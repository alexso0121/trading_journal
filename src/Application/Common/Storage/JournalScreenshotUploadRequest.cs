namespace trading_journel_app.Application.Common.Storage;

public sealed record JournalScreenshotUploadRequest(
    Guid UserId,
    Guid DailyJournalId,
    string FileName,
    string ContentType);