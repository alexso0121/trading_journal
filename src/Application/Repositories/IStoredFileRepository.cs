using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Repositories;

public interface IStoredFileRepository
{
    Task AddAsync(StoredFile storedFile, CancellationToken cancellationToken);
    Task<StoredFile?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<StoredFile>> GetByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken);
}
