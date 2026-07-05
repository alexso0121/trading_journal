using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.Strategies;

public sealed record DeleteStrategyResult(bool Deleted, bool NotFound, bool HasTrades, bool ConcurrencyConflict);

public sealed class DeleteStrategyUseCase(IStrategyRepository strategyRepository, IUnitOfWork unitOfWork)
{
    public async Task<DeleteStrategyResult> ExecuteAsync(
        Guid strategyId,
        int lastKnownVersion,
        CancellationToken cancellationToken)
    {
        var strategy = await strategyRepository.GetByIdAsync(strategyId, cancellationToken);
        if (strategy is null)
        {
            return new DeleteStrategyResult(false, true, false, false);
        }

        if (strategy.Version != lastKnownVersion)
        {
            return new DeleteStrategyResult(false, false, false, true);
        }

        if (await strategyRepository.HasTradesAsync(strategyId, cancellationToken))
        {
            return new DeleteStrategyResult(false, false, true, false);
        }

        strategyRepository.Delete(strategy);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new DeleteStrategyResult(true, false, false, false);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new DeleteStrategyResult(false, false, false, true);
        }
    }
}
