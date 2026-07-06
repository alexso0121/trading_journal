using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed class FinalizeDailyJournalScreenshotsUseCase(
    IDailyJournalRepository dailyJournalRepository,
    IJournalScreenshotStorage journalScreenshotStorage)
{
    public async Task<FinalizeDailyJournalScreenshotsResponse?> ExecuteAsync(
        Guid userId,
        Guid dailyJournalId,
        FinalizeDailyJournalScreenshotsRequest request,
        CancellationToken cancellationToken)
    {
        var journal = await dailyJournalRepository.GetByIdAsync(dailyJournalId, cancellationToken);
        if (journal is null || journal.UserId != userId)
        {
            return null;
        }

        var storageKeys = request.StorageKeys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Select(key => key.Trim())
            .Distinct(StringComparer.Ordinal)
            .Take(50)
            .ToList();

        var items = new List<FinalizeDailyJournalScreenshotItem>(storageKeys.Count);

        foreach (var storageKey in storageKeys)
        {
            var result = await journalScreenshotStorage.FinalizeTempUploadAsync(
                new JournalScreenshotFinalizeRequest(userId, dailyJournalId, storageKey),
                cancellationToken);

            items.Add(new FinalizeDailyJournalScreenshotItem(
                result.TempStorageKey,
                result.StorageKey,
                result.DownloadUrl,
                result.ExpiresAtUtc));
        }

        return new FinalizeDailyJournalScreenshotsResponse(items);
    }
}