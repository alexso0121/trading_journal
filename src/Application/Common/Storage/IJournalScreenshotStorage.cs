namespace trading_journel_app.Application.Common.Storage;

public interface IJournalScreenshotStorage
{
    Task<JournalScreenshotUploadResult> CreateUploadUrlAsync(
        JournalScreenshotUploadRequest request,
        CancellationToken cancellationToken);

    Task<JournalScreenshotUploadResult> CreateTempUploadUrlAsync(
        JournalTempScreenshotUploadRequest request,
        CancellationToken cancellationToken);

    Task<JournalScreenshotFinalizeResult> FinalizeTempUploadAsync(
        JournalScreenshotFinalizeRequest request,
        CancellationToken cancellationToken);

    Task<string> CreateDownloadUrlAsync(string storageKey, CancellationToken cancellationToken);
}