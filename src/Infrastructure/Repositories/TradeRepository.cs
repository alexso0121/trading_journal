using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Infrastructure.Repositories;

public sealed class TradeRepository(TradingJournalDbContext dbContext) : ITradeRepository
{
    public async Task AddAsync(Trade trade, CancellationToken cancellationToken)
    {
        await dbContext.Trades.AddAsync(trade, cancellationToken);
    }

    public Task<Trade?> GetByIdAsync(Guid tradeId, CancellationToken cancellationToken) =>
        dbContext.Trades
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tradeId, cancellationToken);

    public Task<Trade?> GetForUpdateByIdAsync(Guid tradeId, CancellationToken cancellationToken) =>
        dbContext.Trades
            .FirstOrDefaultAsync(t => t.Id == tradeId, cancellationToken);

    public void Delete(Trade trade) => dbContext.Trades.Remove(trade);

    public async Task<IReadOnlyCollection<Trade>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var trades = await dbContext.Trades
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.OpenTimeUtc)
            .ToListAsync(cancellationToken);

        return trades;
    }

    public async Task<(IReadOnlyCollection<Trade> Items, int TotalCount)> SearchByUserIdAsync(
        Guid userId,
        int pageNumber,
        int pageSize,
        Guid? strategyId,
        DateTime? tradingDateUtc,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Trades
            .AsNoTracking()
            .Where(t => t.UserId == userId);

        if (strategyId.HasValue)
        {
            query = query.Where(t => t.StrategyId == strategyId.Value);
        }

        if (tradingDateUtc.HasValue)
        {
            var dayStartUtc = DateTime.SpecifyKind(tradingDateUtc.Value.Date, DateTimeKind.Utc);
            var dayEndUtc = dayStartUtc.AddDays(1);
            query = query.Where(t => t.OpenTimeUtc >= dayStartUtc && t.OpenTimeUtc < dayEndUtc);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.OpenTimeUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
