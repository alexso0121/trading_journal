namespace trading_journel_app.Application.Features.StoredFiles;

public sealed record CreateStoredFileTempUploadUrlResponse(
    Guid FileId,
    string UploadUrl,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
