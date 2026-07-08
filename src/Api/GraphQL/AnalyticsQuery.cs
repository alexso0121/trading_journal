using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Features.Analytics;

namespace trading_journel_app.Api.GraphQL;

public sealed class AnalyticsQuery(IHttpContextAccessor httpContextAccessor, GetTradeAnalyticsSummaryUseCase useCase)
{
    public async Task<TradeAnalyticsSummaryResponse> AnalyticsSummary(
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        CancellationToken cancellationToken)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user is null || !user.TryGetCurrentUserId(out var userId))
        {
            throw new InvalidOperationException("GraphQL analytics requires an authenticated user.");
        }

        if (startDateUtc.HasValue && endDateUtc.HasValue && startDateUtc.Value.Date > endDateUtc.Value.Date)
        {
            throw new ArgumentException("startDateUtc must be earlier than or equal to endDateUtc.");
        }

        return await useCase.ExecuteAsync(userId, startDateUtc, endDateUtc, cancellationToken);
    }
}