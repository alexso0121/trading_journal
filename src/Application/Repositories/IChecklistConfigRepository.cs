using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Repositories;

public interface IChecklistConfigRepository
{
    Task<IReadOnlyCollection<ChecklistConfigItem>> GetAllByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ChecklistConfigItem>> GetAllByUserIdForUpdateAsync(Guid userId, CancellationToken cancellationToken);
    Task<ChecklistConfigItem?> GetByIdAsync(Guid userId, Guid checklistItemId, CancellationToken cancellationToken);
    Task AddAsync(ChecklistConfigItem item, CancellationToken cancellationToken);
    Task<bool> DeleteByIdAsync(Guid userId, Guid checklistItemId, CancellationToken cancellationToken);
}