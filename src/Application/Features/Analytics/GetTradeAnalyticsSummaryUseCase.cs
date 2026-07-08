using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.Analytics;

public sealed class GetTradeAnalyticsSummaryUseCase(ITradeRepository tradeRepository)
{
    public async Task<TradeAnalyticsSummaryResponse> ExecuteAsync(
        Guid userId,
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        CancellationToken cancellationToken)
    {
        var trades = await tradeRepository.GetAllByUserIdAsync(userId, cancellationToken);
        var filteredTrades = ApplyDateRangeFilter(trades, startDateUtc, endDateUtc);
        return TradeAnalyticsSummaryResponse.FromTrades(filteredTrades);
    }

    private static IReadOnlyCollection<Domain.Entities.Trade> ApplyDateRangeFilter(
        IReadOnlyCollection<Domain.Entities.Trade> trades,
        DateTime? startDateUtc,
        DateTime? endDateUtc)
    {
        if (!startDateUtc.HasValue && !endDateUtc.HasValue)
        {
            return trades;
        }

        var normalizedStartUtc = startDateUtc.HasValue
            ? NormalizeToUtcDate(startDateUtc.Value)
            : (DateTime?)null;
        var normalizedEndExclusiveUtc = endDateUtc.HasValue
            ? NormalizeToUtcDate(endDateUtc.Value).AddDays(1)
            : (DateTime?)null;

        var filtered = trades
            .Where(trade =>
                (!normalizedStartUtc.HasValue || trade.OpenTimeUtc >= normalizedStartUtc.Value) &&
                (!normalizedEndExclusiveUtc.HasValue || trade.OpenTimeUtc < normalizedEndExclusiveUtc.Value))
            .ToList();

        return filtered;
    }

    private static DateTime NormalizeToUtcDate(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value.Date,
        DateTimeKind.Local => value.ToUniversalTime().Date,
        _ => DateTime.SpecifyKind(value.Date, DateTimeKind.Utc),
    };
}