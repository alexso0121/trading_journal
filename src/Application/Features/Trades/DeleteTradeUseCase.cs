using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Trades;

public sealed record DeleteTradeResult(bool Deleted, bool NotFound, bool ConcurrencyConflict);

public sealed class DeleteTradeUseCase(ITradeRepository tradeRepository, IUnitOfWork unitOfWork)
{
    public async Task<DeleteTradeResult> ExecuteAsync(
        Guid tradeId,
        int lastKnownVersion,
        CancellationToken cancellationToken)
    {
        var trade = await tradeRepository.GetForUpdateByIdAsync(tradeId, cancellationToken);
        if (trade is null)
        {
            return new DeleteTradeResult(false, true, false);
        }

        if (trade.Version != lastKnownVersion)
        {
            return new DeleteTradeResult(false, false, true);
        }

        tradeRepository.Delete(trade);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new DeleteTradeResult(true, false, false);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new DeleteTradeResult(false, false, true);
        }
    }
}
