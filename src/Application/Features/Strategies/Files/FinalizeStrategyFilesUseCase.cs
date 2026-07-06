using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Features.Strategies.Files;

public sealed class FinalizeStrategyFilesUseCase(
    IStrategyRepository strategyRepository,
    IStoredFileRepository storedFileRepository,
    IStoredFileStorage storedFileStorage,
    IUnitOfWork unitOfWork)
{
    public async Task<FinalizeStrategyFilesResponse?> ExecuteAsync(
        Guid userId,
        Guid strategyId,
        FinalizeStrategyFilesRequest request,
        CancellationToken cancellationToken)
    {
        var strategy = await strategyRepository.GetByIdAsync(strategyId, cancellationToken);
        if (strategy is null || strategy.UserId != userId)
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
            return new FinalizeStrategyFilesResponse([]);
        }

        var files = await storedFileRepository.GetByIdsAsync(fileIds, cancellationToken);
        var filesById = files.ToDictionary(file => file.Id);
        var items = new List<FinalizeStrategyFileItem>(fileIds.Count);

        foreach (var fileId in fileIds)
        {
            if (!filesById.TryGetValue(fileId, out var storedFile) ||
                storedFile.UserId != userId ||
                storedFile.OwnerType != StoredFileOwnerType.Strategy)
            {
                continue;
            }

            if (storedFile.Status == StoredFileStatus.Active && storedFile.OwnerEntityId == strategyId)
            {
                var existingUrl = await storedFileStorage.CreateDownloadUrlAsync(storedFile.StorageKey, cancellationToken);
                items.Add(new FinalizeStrategyFileItem(storedFile.Id, existingUrl, DateTime.UtcNow));
                continue;
            }

            var result = await storedFileStorage.FinalizeTempUploadAsync(
                new StoredFileFinalizeRequest(
                    userId,
                    StoredFileOwnerType.Strategy,
                    strategyId,
                    storedFile.StorageKey,
                    storedFile.FileName,
                    storedFile.ContentType),
                cancellationToken);

            storedFile.Activate(strategyId, result.StorageKey);
            items.Add(new FinalizeStrategyFileItem(storedFile.Id, result.DownloadUrl, result.ExpiresAtUtc));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new FinalizeStrategyFilesResponse(items);
    }
}
