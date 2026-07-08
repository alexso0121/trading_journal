using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Infrastructure.Storage;

public sealed class S3StoredFileStorage(
    IAmazonS3 s3Client,
    IOptions<S3ScreenshotStorageOptions> optionsAccessor) : IStoredFileStorage
{
    private const string TempPrefix = "tmp/files";

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
    };

    private readonly S3ScreenshotStorageOptions options = optionsAccessor.Value;

    public Task<StoredFileUploadResult> CreateTempUploadUrlAsync(
        StoredFileTempUploadRequest request,
        CancellationToken cancellationToken)
    {
        ValidateCommon(request.ContentType);

        var storageKey = BuildTempStorageKey(request.UserId, request.OwnerType, request.FileName, request.ContentType);
        return CreateUploadUrlInternal(storageKey, request.ContentType);
    }

    public async Task<StoredFileFinalizeResult> FinalizeTempUploadAsync(
        StoredFileFinalizeRequest request,
        CancellationToken cancellationToken)
    {
        ValidateCommon(request.ContentType);

        var expectedPrefix = BuildExpectedTempPrefix(request.UserId, request.OwnerType);
        if (!request.TempStorageKey.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid temp file key.");
        }

        var finalStorageKey = BuildFinalStorageKey(
            request.UserId,
            request.OwnerType,
            request.OwnerEntityId,
            request.FileName,
            request.ContentType,
            request.TempStorageKey);

        var copyRequest = new CopyObjectRequest
        {
            SourceBucket = options.BucketName,
            SourceKey = request.TempStorageKey,
            DestinationBucket = options.BucketName,
            DestinationKey = finalStorageKey,
        };

        await s3Client.CopyObjectAsync(copyRequest, cancellationToken);

        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = options.BucketName,
            Key = request.TempStorageKey,
        };

        await s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);

        var downloadExpiryMinutes = Math.Clamp(options.DownloadUrlExpiryMinutes, 1, 1440);
        var expiresAt = DateTime.UtcNow.AddMinutes(downloadExpiryMinutes);
        var downloadUrl = CreateDownloadUrlInternal(finalStorageKey, downloadExpiryMinutes);

        return new StoredFileFinalizeResult(request.TempStorageKey, finalStorageKey, downloadUrl, expiresAt);
    }

    public Task<string> CreateDownloadUrlAsync(string storageKey, CancellationToken cancellationToken)
    {
        var downloadExpiryMinutes = Math.Clamp(options.DownloadUrlExpiryMinutes, 1, 1440);
        return Task.FromResult(CreateDownloadUrlInternal(storageKey, downloadExpiryMinutes));
    }

    private Task<StoredFileUploadResult> CreateUploadUrlInternal(string storageKey, string contentType)
    {
        var uploadExpiryMinutes = Math.Clamp(options.UploadUrlExpiryMinutes, 1, 60);
        var downloadExpiryMinutes = Math.Clamp(options.DownloadUrlExpiryMinutes, 1, 1440);
        var expiresAt = DateTime.UtcNow.AddMinutes(uploadExpiryMinutes);

        var uploadRequest = new GetPreSignedUrlRequest
        {
            BucketName = options.BucketName,
            Key = storageKey,
            Verb = HttpVerb.PUT,
            Expires = expiresAt,
            ContentType = contentType,
            Protocol = Protocol.HTTPS,
        };

        var uploadUrl = s3Client.GetPreSignedURL(uploadRequest);
        var downloadUrl = CreateDownloadUrlInternal(storageKey, downloadExpiryMinutes);

        return Task.FromResult(new StoredFileUploadResult(storageKey, uploadUrl, downloadUrl, expiresAt));
    }

    private void ValidateCommon(string contentType)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName))
        {
            throw new InvalidOperationException("Storage:S3:BucketName is required.");
        }

        if (!AllowedContentTypes.Contains(contentType))
        {
            throw new InvalidOperationException("Unsupported file content type.");
        }
    }

    private string CreateDownloadUrlInternal(string storageKey, int expiryMinutes)
    {
        if (!string.IsNullOrWhiteSpace(options.PublicBaseUrl))
        {
            return $"{options.PublicBaseUrl.TrimEnd('/')}/{Uri.EscapeDataString(storageKey)}";
        }

        var downloadRequest = new GetPreSignedUrlRequest
        {
            BucketName = options.BucketName,
            Key = storageKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Protocol = Protocol.HTTPS,
        };

        return s3Client.GetPreSignedURL(downloadRequest);
    }

    private static string BuildTempStorageKey(Guid userId, StoredFileOwnerType ownerType, string fileName, string contentType)
    {
        var extension = ResolveExtension(fileName, contentType);
        return $"{BuildExpectedTempPrefix(userId, ownerType)}/{Guid.NewGuid():N}{extension}";
    }

    private static string BuildExpectedTempPrefix(Guid userId, StoredFileOwnerType ownerType)
    {
        return $"{TempPrefix}/{ToSegment(ownerType)}/{userId}";
    }

    private static string BuildFinalStorageKey(
        Guid userId,
        StoredFileOwnerType ownerType,
        Guid ownerEntityId,
        string fileName,
        string contentType,
        string tempStorageKey)
    {
        var extension = System.IO.Path.GetExtension(tempStorageKey);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ResolveExtension(fileName, contentType);
        }

        return $"{ToSegment(ownerType)}/{userId}/{ownerEntityId}/{Guid.NewGuid():N}{extension}";
    }

    private static string ToSegment(StoredFileOwnerType ownerType) => ownerType switch
    {
        StoredFileOwnerType.DailyJournal => "journals",
        StoredFileOwnerType.Strategy => "strategies",
        _ => throw new InvalidOperationException("Unsupported stored file owner type."),
    };

    private static string ResolveExtension(string fileName, string contentType)
    {
        var extension = System.IO.Path.GetExtension(fileName)?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = contentType switch
            {
                "image/png" => ".png",
                "image/jpeg" => ".jpg",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                _ => ".bin",
            };
        }

        return extension;
    }
}
