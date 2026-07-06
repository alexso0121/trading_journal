namespace trading_journel_app.Infrastructure.Storage;

public sealed class S3ScreenshotStorageOptions
{
    public const string SectionName = "Storage:S3";

    public string BucketName { get; init; } = string.Empty;
    public string? PublicBaseUrl { get; init; }
    public int UploadUrlExpiryMinutes { get; init; } = 15;
    public int DownloadUrlExpiryMinutes { get; init; } = 60;
    public string? KeyPrefix { get; init; }
}