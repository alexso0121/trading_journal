using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Infrastructure.Repositories;

public sealed class ChecklistConfigRepository(TradingJournalDbContext dbContext) : IChecklistConfigRepository
{
    public async Task<IReadOnlyCollection<ChecklistConfigItem>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var items = await dbContext.ChecklistConfigItems
            .Where(i => i.UserId == userId)
            .AsNoTracking()
            .OrderBy(i => i.Sequence)
            .ToListAsync(cancellationToken);

        return items;
    }

    public async Task<IReadOnlyCollection<ChecklistConfigItem>> GetAllByUserIdForUpdateAsync(Guid userId, CancellationToken cancellationToken)
    {
        var items = await dbContext.ChecklistConfigItems
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.Sequence)
            .ToListAsync(cancellationToken);

        return items;
    }

    public Task<ChecklistConfigItem?> GetByIdAsync(Guid userId, Guid checklistItemId, CancellationToken cancellationToken) =>
        dbContext.ChecklistConfigItems
            .FirstOrDefaultAsync(i => i.UserId == userId && i.Id == checklistItemId, cancellationToken);

    public async Task AddAsync(ChecklistConfigItem item, CancellationToken cancellationToken)
    {
        await dbContext.ChecklistConfigItems.AddAsync(item, cancellationToken);
    }

    public async Task<bool> DeleteByIdAsync(Guid userId, Guid checklistItemId, CancellationToken cancellationToken)
    {
        var item = await dbContext.ChecklistConfigItems
            .FirstOrDefaultAsync(i => i.UserId == userId && i.Id == checklistItemId, cancellationToken);

        if (item is null)
        {
            return false;
        }

        dbContext.ChecklistConfigItems.Remove(item);
        return true;
    }
}