using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed class CreateDailyJournalScreenshotUploadUrlUseCase(
    IDailyJournalRepository dailyJournalRepository,
    IJournalScreenshotStorage journalScreenshotStorage,
    IUnitOfWork unitOfWork)
{
    public async Task<CreateDailyJournalScreenshotUploadUrlResponse?> ExecuteAsync(
        Guid userId,
        Guid dailyJournalId,
        CreateDailyJournalScreenshotUploadUrlRequest request,
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

        var journal = await dailyJournalRepository.GetByIdAsync(dailyJournalId, cancellationToken);
        if (journal is null || journal.UserId != userId)
        {
            return null;
        }

        var uploadResult = await journalScreenshotStorage.CreateUploadUrlAsync(
            new JournalScreenshotUploadRequest(
                userId,
                dailyJournalId,
                request.FileName,
                request.ContentType),
            cancellationToken);

        var screenshot = Domain.Entities.DailyJournalScreenshot.Create(
            dailyJournalId,
            userId,
            uploadResult.StorageKey,
            request.FileName,
            request.ContentType,
            uploadResult.DownloadUrl,
            uploadResult.ExpiresAtUtc);

        await dailyJournalRepository.AddScreenshotAsync(screenshot, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateDailyJournalScreenshotUploadUrlResponse(
            uploadResult.StorageKey,
            uploadResult.UploadUrl,
            uploadResult.DownloadUrl,
            uploadResult.ExpiresAtUtc);
    }
}