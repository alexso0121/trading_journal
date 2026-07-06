using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Common.Storage;

public interface IStoredFileStorage
{
    Task<StoredFileUploadResult> CreateTempUploadUrlAsync(
        StoredFileTempUploadRequest request,
        CancellationToken cancellationToken);

    Task<StoredFileFinalizeResult> FinalizeTempUploadAsync(
        StoredFileFinalizeRequest request,
        CancellationToken cancellationToken);

    Task<string> CreateDownloadUrlAsync(string storageKey, CancellationToken cancellationToken);
}
