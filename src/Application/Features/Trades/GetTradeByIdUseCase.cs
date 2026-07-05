using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Trades;

public sealed class GetTradeByIdUseCase(ITradeRepository tradeRepository)
{
    public async Task<TradeResponse?> ExecuteAsync(Guid tradeId, CancellationToken cancellationToken)
    {
        var trade = await tradeRepository.GetByIdAsync(tradeId, cancellationToken);
        return trade is null ? null : TradeResponse.FromEntity(trade);
    }
}
