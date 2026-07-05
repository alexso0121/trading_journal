using trading_journel_app.Application.Repositories;
using trading_journel_app.Application.Strategies;

namespace trading_journel_app.Application.Features.Strategies;

public sealed class GetStrategyByIdUseCase(IStrategyRepository strategyRepository)
{
    public async Task<StrategyResponse?> ExecuteAsync(Guid strategyId, CancellationToken cancellationToken)
    {
        var strategy = await strategyRepository.GetByIdAsync(strategyId, cancellationToken);
        return strategy is null ? null : StrategyResponse.FromEntity(strategy);
    }
}
