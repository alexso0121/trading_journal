using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Infrastructure.Repositories;

public sealed class StoredFileRepository(TradingJournalDbContext dbContext) : IStoredFileRepository
{
    public async Task AddAsync(StoredFile storedFile, CancellationToken cancellationToken)
    {
        await dbContext.StoredFiles.AddAsync(storedFile, cancellationToken);
    }

    public Task<StoredFile?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.StoredFiles.FirstOrDefaultAsync(file => file.Id == id, cancellationToken);

    public async Task<IReadOnlyCollection<StoredFile>> GetByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        return await dbContext.StoredFiles
            .Where(file => ids.Contains(file.Id))
            .ToListAsync(cancellationToken);
    }
}
