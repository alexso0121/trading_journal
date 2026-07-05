using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed class DeleteDailyJournalUseCase(IDailyJournalRepository dailyJournalRepository, IUnitOfWork unitOfWork)
{
    public async Task<bool> ExecuteAsync(Guid journalId, CancellationToken cancellationToken)
    {
        var deleted = await dailyJournalRepository.DeleteByIdAsync(journalId, cancellationToken);
        if (!deleted)
        {
            return false;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
