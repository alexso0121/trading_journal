using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Repositories;

public interface ITradeRepository
{
    Task AddAsync(Trade trade, CancellationToken cancellationToken);
    Task<Trade?> GetByIdAsync(Guid tradeId, CancellationToken cancellationToken);
    Task<Trade?> GetForUpdateByIdAsync(Guid tradeId, CancellationToken cancellationToken);
    void Delete(Trade trade);
    Task<IReadOnlyCollection<Trade>> GetByUserIdAndDateAsync(Guid userId, DateTime tradingDateUtc, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Trade>> GetByUserIdWithinDateRangeAsync(
        Guid userId,
        DateTime startDateUtcInclusive,
        DateTime endDateUtcExclusive,
        CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Trade>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<(IReadOnlyCollection<Trade> Items, int TotalCount)> SearchByUserIdAsync(
        Guid userId,
        int pageNumber,
        int pageSize,
        Guid? strategyId,
        DateTime? tradingDateUtc,
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        CancellationToken cancellationToken);
}
