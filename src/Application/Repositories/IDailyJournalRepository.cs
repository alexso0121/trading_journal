using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Repositories;

public interface IDailyJournalRepository
{
    Task AddAsync(DailyJournal dailyJournal, CancellationToken cancellationToken);
    Task<DailyJournal?> GetByIdAsync(Guid journalId, CancellationToken cancellationToken);
    Task<DailyJournal?> GetByUserIdAndDateAsync(Guid userId, DateTime journalDateUtc, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<DailyJournal>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> DeleteByIdAsync(Guid journalId, CancellationToken cancellationToken);
}
