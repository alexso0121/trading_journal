using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using trading_journel_app.Application.Common.Storage;

namespace trading_journel_app.Infrastructure.Storage;

public sealed class S3StrategyContentImageStorage(
    IAmazonS3 s3Client,
    IOptions<S3ScreenshotStorageOptions> optionsAccessor) : IStrategyContentImageStorage
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
    };

    private readonly S3ScreenshotStorageOptions options = optionsAccessor.Value;

    public Task<StrategyContentImageUploadResult> CreateUploadUrlAsync(
        StrategyContentImageUploadRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName))
        {
            throw new InvalidOperationException("Storage:S3:BucketName is required.");
        }

        if (!AllowedContentTypes.Contains(request.ContentType))
        {
            throw new InvalidOperationException("Unsupported strategy image content type.");
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

        return Task.FromResult(new StrategyContentImageUploadResult(storageKey, uploadUrl, downloadUrl, expiresAt));
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

    private string BuildStorageKey(StrategyContentImageUploadRequest request)
    {
        var extension = System.IO.Path.GetExtension(request.FileName)?.Trim().ToLowerInvariant();
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

        return $"strategies/{request.UserId}/{request.StrategyId}/{Guid.NewGuid():N}{extension}";
    }
}