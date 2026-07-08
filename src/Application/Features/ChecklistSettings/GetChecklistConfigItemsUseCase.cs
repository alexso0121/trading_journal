using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class GetChecklistConfigItemsUseCase(IChecklistConfigRepository checklistConfigRepository)
{
    public async Task<IReadOnlyCollection<ChecklistConfigItemResponse>> ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var items = await checklistConfigRepository.GetAllByUserIdAsync(userId, cancellationToken);
        return items.Select(ChecklistConfigItemResponse.FromEntity).ToList();
    }
}