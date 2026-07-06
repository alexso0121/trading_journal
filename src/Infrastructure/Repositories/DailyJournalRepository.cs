using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Infrastructure.Repositories;

public sealed class DailyJournalRepository(TradingJournalDbContext dbContext) : IDailyJournalRepository
{
    public async Task AddAsync(DailyJournal dailyJournal, CancellationToken cancellationToken)
    {
        await dbContext.DailyJournals.AddAsync(dailyJournal, cancellationToken);
    }

    public Task<DailyJournal?> GetByIdAsync(Guid journalId, CancellationToken cancellationToken) =>
        dbContext.DailyJournals
            .FirstOrDefaultAsync(j => j.Id == journalId, cancellationToken);

    public async Task<IReadOnlyCollection<DailyJournal>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var journals = await dbContext.DailyJournals
            .Where(j => j.UserId == userId)
            .AsNoTracking()
            .OrderByDescending(j => j.JournalDateUtc)
            .ToListAsync(cancellationToken);

        return journals;
    }

    public async Task<bool> DeleteByIdAsync(Guid journalId, CancellationToken cancellationToken)
    {
        var dailyJournal = await dbContext.DailyJournals
            .FirstOrDefaultAsync(j => j.Id == journalId, cancellationToken);

        if (dailyJournal is null)
        {
            return false;
        }
        dbContext.DailyJournals.Remove(dailyJournal);
        return true;
    }
}
