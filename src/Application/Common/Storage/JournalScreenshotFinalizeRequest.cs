namespace trading_journel_app.Application.Common.Storage;

public sealed record JournalScreenshotFinalizeRequest(
    Guid UserId,
    Guid DailyJournalId,
    string TempStorageKey);
