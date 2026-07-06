using trading_journel_app.Application.Common;
using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Trades;

public sealed class GetTradesUseCase(ITradeRepository tradeRepository)
{
    public async Task<PagedResponse<TradeResponse>> ExecuteAsync(
        Guid userId,
        GetTradesRequest request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await tradeRepository.SearchByUserIdAsync(
            userId,
            request.PageNumber,
            request.PageSize,
            request.StrategyId,
            request.TradingDateUtc,
            request.StartDateUtc,
            request.EndDateUtc,
            cancellationToken);

        return new PagedResponse<TradeResponse>(
            items.Select(TradeResponse.FromEntity).ToList(),
            request.PageNumber,
            request.PageSize,
            totalCount);
    }
}
