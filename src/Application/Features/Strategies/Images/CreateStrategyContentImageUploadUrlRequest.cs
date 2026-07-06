namespace trading_journel_app.Application.Features.Strategies.Images;

public sealed class CreateStrategyContentImageUploadUrlRequest
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
}