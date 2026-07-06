using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Common.Storage;

public sealed record StoredFileFinalizeRequest(
    Guid UserId,
    StoredFileOwnerType OwnerType,
    Guid OwnerEntityId,
    string TempStorageKey,
    string FileName,
    string ContentType);
