namespace trading_journel_app.Application.Common.Storage;

public sealed record StrategyContentImageUploadRequest(
    Guid UserId,
    Guid StrategyId,
    string FileName,
    string ContentType);