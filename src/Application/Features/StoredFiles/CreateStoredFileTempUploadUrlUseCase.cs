using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Features.StoredFiles;

public sealed class CreateStoredFileTempUploadUrlUseCase(
    IStoredFileRepository storedFileRepository,
    IStoredFileStorage storedFileStorage,
    IUnitOfWork unitOfWork)
{
    public async Task<CreateStoredFileTempUploadUrlResponse> ExecuteAsync(
        Guid userId,
        StoredFileOwnerType ownerType,
        CreateStoredFileTempUploadUrlRequest request,
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

        var uploadResult = await storedFileStorage.CreateTempUploadUrlAsync(
            new StoredFileTempUploadRequest(userId, ownerType, request.FileName, request.ContentType),
            cancellationToken);

        var storedFile = StoredFile.CreateTemp(
            userId,
            ownerType,
            request.FileName,
            request.ContentType,
            uploadResult.StorageKey);

        await storedFileRepository.AddAsync(storedFile, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateStoredFileTempUploadUrlResponse(
            storedFile.Id,
            uploadResult.UploadUrl,
            uploadResult.DownloadUrl,
            uploadResult.ExpiresAtUtc);
    }
}
