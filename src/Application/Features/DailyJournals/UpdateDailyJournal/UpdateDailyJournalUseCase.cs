using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

public sealed class UpdateDailyJournalUseCase(IDailyJournalRepository dailyJournalRepository, IUnitOfWork unitOfWork)
{
    public async Task<DailyJournalResponse?> ExecuteAsync(
        Guid journalId,
        UpdateDailyJournalRequest request,
        CancellationToken cancellationToken)
    {
        var journal = await dailyJournalRepository.GetByIdAsync(journalId, cancellationToken);
        if (journal is null)
        {
            return null;
        }

        journal.Update(request.JournalDateUtc, request.TradeIdea, request.Reflection);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return DailyJournalResponse.FromEntity(journal);
    }
}
