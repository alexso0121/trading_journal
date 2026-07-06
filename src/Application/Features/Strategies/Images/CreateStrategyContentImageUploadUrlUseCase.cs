using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.Strategies.Images;

public sealed class CreateStrategyContentImageUploadUrlUseCase(
    IStrategyRepository strategyRepository,
    IStrategyContentImageStorage strategyContentImageStorage)
{
    public async Task<CreateStrategyContentImageUploadUrlResponse?> ExecuteAsync(
        Guid userId,
        Guid strategyId,
        CreateStrategyContentImageUploadUrlRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            throw new ArgumentException("FileName is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.ContentType))
        {
            throw new ArgumentException("ContentType is required.", nameof(request));
        }

        var strategy = await strategyRepository.GetByIdAsync(strategyId, cancellationToken);
        if (strategy is null || strategy.UserId != userId)
        {
            return null;
        }

        var uploadResult = await strategyContentImageStorage.CreateUploadUrlAsync(
            new StrategyContentImageUploadRequest(
                userId,
                strategyId,
                request.FileName,
                request.ContentType),
            cancellationToken);

        return new CreateStrategyContentImageUploadUrlResponse(
            uploadResult.StorageKey,
            uploadResult.UploadUrl,
            uploadResult.DownloadUrl,
            uploadResult.ExpiresAtUtc);
    }
}