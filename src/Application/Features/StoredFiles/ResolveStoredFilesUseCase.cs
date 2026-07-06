using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.StoredFiles;

public sealed class ResolveStoredFilesUseCase(
    IStoredFileRepository storedFileRepository,
    IStoredFileStorage storedFileStorage)
{
    public async Task<ResolveStoredFilesResponse> ExecuteAsync(
        Guid userId,
        ResolveStoredFilesRequest request,
        CancellationToken cancellationToken)
    {
        var fileIds = request.FileIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .Take(100)
            .ToList();

        if (fileIds.Count == 0)
        {
            return new ResolveStoredFilesResponse([]);
        }

        var files = await storedFileRepository.GetByIdsAsync(fileIds, cancellationToken);
        var items = new List<ResolveStoredFileItem>(files.Count);

        foreach (var file in files.Where(file => file.UserId == userId))
        {
            var downloadUrl = await storedFileStorage.CreateDownloadUrlAsync(file.StorageKey, cancellationToken);
            items.Add(new ResolveStoredFileItem(file.Id, downloadUrl, DateTime.UtcNow));
        }

        return new ResolveStoredFilesResponse(items);
    }
}
