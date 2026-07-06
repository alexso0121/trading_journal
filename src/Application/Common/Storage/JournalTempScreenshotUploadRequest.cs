namespace trading_journel_app.Application.Common.Storage;

public sealed record JournalTempScreenshotUploadRequest(
    Guid UserId,
    string FileName,
    string ContentType);
