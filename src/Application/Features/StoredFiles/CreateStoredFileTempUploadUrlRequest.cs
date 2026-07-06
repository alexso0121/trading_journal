namespace trading_journel_app.Application.Features.StoredFiles;

public sealed class CreateStoredFileTempUploadUrlRequest
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
}
