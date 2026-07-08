using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class DeleteChecklistConfigItemUseCase(
    IChecklistConfigRepository checklistConfigRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<bool> ExecuteAsync(Guid userId, Guid checklistItemId, CancellationToken cancellationToken)
    {
        var deleted = false;

        await unitOfWork.ExecuteInTransactionAsync(async transactionCancellationToken =>
        {
            deleted = await checklistConfigRepository.DeleteByIdAsync(userId, checklistItemId, transactionCancellationToken);
            if (!deleted)
            {
                return;
            }

            await unitOfWork.SaveChangesAsync(transactionCancellationToken);

            var remaining = await checklistConfigRepository.GetAllByUserIdForUpdateAsync(userId, transactionCancellationToken);
            var sequence = 1;
            foreach (var item in remaining)
            {
                item.SetSequence(sequence);
                sequence += 1;
            }

            await unitOfWork.SaveChangesAsync(transactionCancellationToken);
        }, cancellationToken);

        return deleted;
    }
}