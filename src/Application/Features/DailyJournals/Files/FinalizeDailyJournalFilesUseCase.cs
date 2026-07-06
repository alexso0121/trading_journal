using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Features.DailyJournals.Files;

public sealed class FinalizeDailyJournalFilesUseCase(
    IDailyJournalRepository dailyJournalRepository,
    IStoredFileRepository storedFileRepository,
    IStoredFileStorage storedFileStorage,
    IUnitOfWork unitOfWork)
{
    public async Task<FinalizeDailyJournalFilesResponse?> ExecuteAsync(
        Guid userId,
        Guid dailyJournalId,
        FinalizeDailyJournalFilesRequest request,
        CancellationToken cancellationToken)
    {
        var journal = await dailyJournalRepository.GetByIdAsync(dailyJournalId, cancellationToken);
        if (journal is null || journal.UserId != userId)
        {
            return null;
        }

        var fileIds = request.FileIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .Take(50)
            .ToList();

        if (fileIds.Count == 0)
        {
            return new FinalizeDailyJournalFilesResponse([]);
        }

        var files = await storedFileRepository.GetByIdsAsync(fileIds, cancellationToken);
        var filesById = files.ToDictionary(file => file.Id);
        var items = new List<FinalizeDailyJournalFileItem>(fileIds.Count);

        foreach (var fileId in fileIds)
        {
            if (!filesById.TryGetValue(fileId, out var storedFile) ||
                storedFile.UserId != userId ||
                storedFile.OwnerType != StoredFileOwnerType.DailyJournal)
            {
                continue;
            }

            if (storedFile.Status == StoredFileStatus.Active && storedFile.OwnerEntityId == dailyJournalId)
            {
                var existingUrl = await storedFileStorage.CreateDownloadUrlAsync(storedFile.StorageKey, cancellationToken);
                items.Add(new FinalizeDailyJournalFileItem(storedFile.Id, existingUrl, DateTime.UtcNow));
                continue;
            }

            var result = await storedFileStorage.FinalizeTempUploadAsync(
                new StoredFileFinalizeRequest(
                    userId,
                    StoredFileOwnerType.DailyJournal,
                    dailyJournalId,
                    storedFile.StorageKey,
                    storedFile.FileName,
                    storedFile.ContentType),
                cancellationToken);

            storedFile.Activate(dailyJournalId, result.StorageKey);
            items.Add(new FinalizeDailyJournalFileItem(storedFile.Id, result.DownloadUrl, result.ExpiresAtUtc));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new FinalizeDailyJournalFilesResponse(items);
    }
}
