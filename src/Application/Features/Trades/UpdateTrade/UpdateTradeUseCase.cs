using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Trades.UpdateTrade;

public sealed record UpdateTradeResult(bool NotFound, bool ConcurrencyConflict, TradeResponse? Trade);

public sealed class UpdateTradeUseCase(ITradeRepository tradeRepository, IUnitOfWork unitOfWork)
{
    public async Task<UpdateTradeResult> ExecuteAsync(
        Guid tradeId,
        UpdateTradeRequest request,
        CancellationToken cancellationToken)
    {
        var trade = await tradeRepository.GetForUpdateByIdAsync(tradeId, cancellationToken);
        if (trade is null)
        {
            return new UpdateTradeResult(true, false, null);
        }

        if (trade.Version != request.LastKnownVersion)
        {
            return new UpdateTradeResult(false, true, null);
        }

        trade.Update(
            request.StrategyId,
            request.Ticker,
            request.Market,
            request.Asset,
            request.Direction,
            request.Status,
            request.EntryPrice,
            request.Quantity,
            request.Pnl,
            request.Comments,
            request.OpenTimeUtc,
            request.CloseTimeUtc);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new UpdateTradeResult(false, false, TradeResponse.FromEntity(trade));
        }
        catch (DbUpdateConcurrencyException)
        {
            return new UpdateTradeResult(false, true, null);
        }
    }
}
