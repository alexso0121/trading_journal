using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class CreateChecklistConfigItemUseCase(
    IChecklistConfigRepository checklistConfigRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<ChecklistConfigItemResponse> ExecuteAsync(
        Guid userId,
        CreateChecklistConfigItemRequest request,
        CancellationToken cancellationToken)
    {
        var existing = await checklistConfigRepository.GetAllByUserIdAsync(userId, cancellationToken);
        var nextSequence = existing.Count + 1;

        var item = ChecklistConfigItem.Create(userId, request.Label, nextSequence);
        await checklistConfigRepository.AddAsync(item, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ChecklistConfigItemResponse.FromEntity(item);
    }
}