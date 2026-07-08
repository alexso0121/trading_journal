using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class ReorderChecklistConfigItemsUseCase(
    IChecklistConfigRepository checklistConfigRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<bool> ExecuteAsync(Guid userId, ReorderChecklistConfigItemsRequest request, CancellationToken cancellationToken)
    {
        var items = await checklistConfigRepository.GetAllByUserIdForUpdateAsync(userId, cancellationToken);
        if (items.Count != request.ItemIds.Count)
        {
            return false;
        }

        var byId = items.ToDictionary(i => i.Id, i => i);
        var offset = items.Max(i => i.Sequence) + request.ItemIds.Count + 1;
        var offsetSequence = offset;

        foreach (var id in request.ItemIds)
        {
            if (!byId.TryGetValue(id, out var item))
            {
                return false;
            }

            item.SetSequence(offsetSequence);
            offsetSequence += 1;
        }

        await unitOfWork.ExecuteInTransactionAsync(async transactionCancellationToken =>
        {
            await unitOfWork.SaveChangesAsync(transactionCancellationToken);

            var sequence = 1;

            foreach (var id in request.ItemIds)
            {
                var item = byId[id];
                item.SetSequence(sequence);
                sequence += 1;
            }

            await unitOfWork.SaveChangesAsync(transactionCancellationToken);
        }, cancellationToken);

        return true;
    }
}