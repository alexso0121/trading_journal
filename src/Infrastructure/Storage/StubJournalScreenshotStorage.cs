using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using trading_journel_app.Application.Common.Storage;

namespace trading_journel_app.Infrastructure.Storage;

public sealed class StubJournalScreenshotStorage(
    IAmazonS3 s3Client,
    IOptions<S3ScreenshotStorageOptions> optionsAccessor) : IJournalScreenshotStorage
{
    private const string TempPrefix = "tmp";

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
    };

    private readonly S3ScreenshotStorageOptions options = optionsAccessor.Value;

    public Task<JournalScreenshotUploadResult> CreateUploadUrlAsync(
        JournalScreenshotUploadRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName))
        {
            throw new InvalidOperationException("Storage:S3:BucketName is required.");
        }

        if (!AllowedContentTypes.Contains(request.ContentType))
        {
            throw new InvalidOperationException("Unsupported screenshot content type.");
        }

        var storageKey = BuildStorageKey(request);
        return CreateUploadUrlInternal(storageKey, request.ContentType);
    }

    public Task<JournalScreenshotUploadResult> CreateTempUploadUrlAsync(
        JournalTempScreenshotUploadRequest request,
        CancellationToken cancellationToken)
    {
        ValidateCommon(request.ContentType);

        var storageKey = BuildTempStorageKey(request);
        return CreateUploadUrlInternal(storageKey, request.ContentType);
    }

    public async Task<JournalScreenshotFinalizeResult> FinalizeTempUploadAsync(
        JournalScreenshotFinalizeRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TempStorageKey))
        {
            throw new ArgumentException("TempStorageKey is required.", nameof(request));
        }

        var expectedTempPrefix = BuildExpectedTempPrefix(request.UserId);
        if (!request.TempStorageKey.StartsWith(expectedTempPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid temp screenshot key.");
        }

        var finalStorageKey = BuildFinalStorageKeyFromTemp(request.UserId, request.DailyJournalId, request.TempStorageKey);

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

        return new JournalScreenshotFinalizeResult(
            request.TempStorageKey,
            finalStorageKey,
            downloadUrl,
            expiresAt);
    }

    private Task<JournalScreenshotUploadResult> CreateUploadUrlInternal(string storageKey, string contentType)
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

        return Task.FromResult(new JournalScreenshotUploadResult(storageKey, uploadUrl, downloadUrl, expiresAt));
    }

    private void ValidateCommon(string contentType)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName))
        {
            throw new InvalidOperationException("Storage:S3:BucketName is required.");
        }

        if (!AllowedContentTypes.Contains(contentType))
        {
            throw new InvalidOperationException("Unsupported screenshot content type.");
        }
    }

    public Task<string> CreateDownloadUrlAsync(string storageKey, CancellationToken cancellationToken)
    {
        var downloadExpiryMinutes = Math.Clamp(options.DownloadUrlExpiryMinutes, 1, 1440);
        return Task.FromResult(CreateDownloadUrlInternal(storageKey, downloadExpiryMinutes));
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

    private string BuildStorageKey(JournalScreenshotUploadRequest request)
    {
        var extension = ResolveExtension(request.FileName, request.ContentType);
        return BuildFinalStorageKey(request.UserId, request.DailyJournalId, extension);
    }

    private string BuildTempStorageKey(JournalTempScreenshotUploadRequest request)
    {
        var extension = ResolveExtension(request.FileName, request.ContentType);
        var prefix = BuildExpectedTempPrefix(request.UserId);
        return $"{prefix}/{Guid.NewGuid():N}{extension}";
    }

    private string BuildFinalStorageKeyFromTemp(Guid userId, Guid dailyJournalId, string tempStorageKey)
    {
        var extension = Path.GetExtension(tempStorageKey);
        return BuildFinalStorageKey(userId, dailyJournalId, extension);
    }

    private string BuildFinalStorageKey(Guid userId, Guid dailyJournalId, string extension)
    {
        var prefix = string.IsNullOrWhiteSpace(options.KeyPrefix)
            ? "journals"
            : options.KeyPrefix.Trim().Trim('/');

        return $"{prefix}/{userId}/{dailyJournalId}/{Guid.NewGuid():N}{extension}";
    }

    private static string ResolveExtension(string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName)?.Trim().ToLowerInvariant();
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

    private static string BuildExpectedTempPrefix(Guid userId)
    {
        return $"{TempPrefix}/journals/{userId}";
    }
}