using trading_journel_app.Application.Common.Storage;

namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed class CreateDailyJournalTempScreenshotUploadUrlUseCase(
    IJournalScreenshotStorage journalScreenshotStorage)
{
    public async Task<CreateDailyJournalTempScreenshotUploadUrlResponse> ExecuteAsync(
        Guid userId,
        CreateDailyJournalTempScreenshotUploadUrlRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            throw new ArgumentException("FileName is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.ContentType))
        {
            throw new ArgumentException("ContentType is required.", nameof(request));
        }

        var uploadResult = await journalScreenshotStorage.CreateTempUploadUrlAsync(
            new JournalTempScreenshotUploadRequest(
                userId,
                request.FileName,
                request.ContentType),
            cancellationToken);

        return new CreateDailyJournalTempScreenshotUploadUrlResponse(
            uploadResult.StorageKey,
            uploadResult.UploadUrl,
            uploadResult.DownloadUrl,
            uploadResult.ExpiresAtUtc);
    }
}