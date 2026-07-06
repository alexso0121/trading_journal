using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using trading_journel_app.Application.Common.Storage;

namespace trading_journel_app.Infrastructure.Storage;

public sealed class StubJournalScreenshotStorage(
    IAmazonS3 s3Client,
    IOptions<S3ScreenshotStorageOptions> optionsAccessor) : IJournalScreenshotStorage
{
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
        var uploadExpiryMinutes = Math.Clamp(options.UploadUrlExpiryMinutes, 1, 60);
        var downloadExpiryMinutes = Math.Clamp(options.DownloadUrlExpiryMinutes, 1, 1440);
        var expiresAt = DateTime.UtcNow.AddMinutes(uploadExpiryMinutes);

        var uploadRequest = new GetPreSignedUrlRequest
        {
            BucketName = options.BucketName,
            Key = storageKey,
            Verb = HttpVerb.PUT,
            Expires = expiresAt,
            ContentType = request.ContentType,
            Protocol = Protocol.HTTPS,
        };

        var uploadUrl = s3Client.GetPreSignedURL(uploadRequest);

        var downloadUrl = CreateDownloadUrlInternal(storageKey, downloadExpiryMinutes);

        return Task.FromResult(new JournalScreenshotUploadResult(storageKey, uploadUrl, downloadUrl, expiresAt));
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
        var extension = Path.GetExtension(request.FileName)?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = request.ContentType switch
            {
                "image/png" => ".png",
                "image/jpeg" => ".jpg",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                _ => ".bin",
            };
        }

        var prefix = string.IsNullOrWhiteSpace(options.KeyPrefix)
            ? "journals"
            : options.KeyPrefix.Trim().Trim('/');

        return $"{prefix}/{request.UserId}/{request.DailyJournalId}/{Guid.NewGuid():N}{extension}";
    }
}