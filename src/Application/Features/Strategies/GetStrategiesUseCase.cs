using trading_journel_app.Application.Common;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Strategies;

public sealed class GetStrategiesUseCase(IStrategyRepository strategyRepository)
{
    public async Task<PagedResponse<StrategyResponse>> ExecuteAsync(
        Guid userId,
        GetStrategiesRequest request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await strategyRepository.GetPagedByUserIdAsync(
            userId,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        return new PagedResponse<StrategyResponse>(
            items.Select(StrategyResponse.FromEntity).ToList(),
            request.PageNumber,
            request.PageSize,
            totalCount);
    }
}
