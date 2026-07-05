using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Infrastructure.Repositories;

public sealed class StrategyRepository(TradingJournalDbContext dbContext) : IStrategyRepository
{
    public async Task AddAsync(Strategy strategy, CancellationToken cancellationToken)
    {
        await dbContext.Strategies.AddAsync(strategy, cancellationToken);
    }

    public Task<Strategy?> GetByIdAsync(Guid strategyId, CancellationToken cancellationToken) =>
        dbContext.Strategies
            .Include(s => s.Trades)
            .FirstOrDefaultAsync(s => s.Id == strategyId, cancellationToken);

    public async Task<IReadOnlyCollection<Strategy>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var strategies = await dbContext.Strategies
            .AsNoTracking()
            .Include(s => s.Trades)
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return strategies;
    }

    public async Task<(IReadOnlyCollection<Strategy> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Strategies
            .AsNoTracking()
            .Include(s => s.Trades)
            .Where(s => s.UserId == userId);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(s => s.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<bool> HasTradesAsync(Guid strategyId, CancellationToken cancellationToken) =>
        dbContext.Trades.AnyAsync(t => t.StrategyId == strategyId, cancellationToken);

    public void Delete(Strategy strategy) => dbContext.Strategies.Remove(strategy);

    public Task<bool> ExistsByNameAndUserId(string name, Guid userId, CancellationToken cancellationToken)
    {
        return dbContext.Strategies
            .AnyAsync(s => s.Name == name && s.UserId == userId, cancellationToken);
    }
}
