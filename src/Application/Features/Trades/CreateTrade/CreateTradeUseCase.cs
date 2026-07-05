using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Trades.CreateTrade;

public sealed class CreateTradeUseCase(ITradeRepository tradeRepository, IUnitOfWork unitOfWork)
{
    public async Task<TradeResponse> ExecuteAsync(CreateTradeRequest request, Guid userId, CancellationToken cancellationToken)
    {
        var trade = Trade.Create(
            request.StrategyId,
            userId,
            request.Ticker,
            request.Market,
            request.Direction,
            request.EntryPrice,
            request.Quantity,
            request.OpenTimeUtc);

        await tradeRepository.AddAsync(trade, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return TradeResponse.FromEntity(trade);
    }
}
