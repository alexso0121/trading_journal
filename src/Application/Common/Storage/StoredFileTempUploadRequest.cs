using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Common.Storage;

public sealed record StoredFileTempUploadRequest(
    Guid UserId,
    StoredFileOwnerType OwnerType,
    string FileName,
    string ContentType);
