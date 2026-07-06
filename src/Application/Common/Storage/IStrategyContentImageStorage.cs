namespace trading_journel_app.Application.Common.Storage;

public interface IStrategyContentImageStorage
{
    Task<StrategyContentImageUploadResult> CreateUploadUrlAsync(
        StrategyContentImageUploadRequest request,
        CancellationToken cancellationToken);
}