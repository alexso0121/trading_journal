using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Repositories;

public interface IStrategyRepository
{
    Task AddAsync(Strategy strategy, CancellationToken cancellationToken);
    Task AddTagAsync(StrategyTag tag, CancellationToken cancellationToken);
    Task<Strategy?> GetByIdAsync(Guid strategyId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Strategy>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<(IReadOnlyCollection<Strategy> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);
    Task<bool> HasTradesAsync(Guid strategyId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<StrategyTag>> GetTagsByNormalizedNamesAsync(
        Guid userId,
        IReadOnlyCollection<string> normalizedNames,
        CancellationToken cancellationToken);
    void Delete(Strategy strategy);
    Task<bool> ExistsByNameAndUserId(string name, Guid userId, CancellationToken cancellationToken);
}
