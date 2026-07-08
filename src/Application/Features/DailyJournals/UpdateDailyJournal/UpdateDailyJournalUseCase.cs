using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;

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

        journal.Update(
            request.JournalDateUtc,
            request.TradeIdea,
            request.Reflection,
            request.ChecklistItems.Count > 0);

        var checklistItems = request.ChecklistItems
            .OrderBy(i => i.Sequence)
            .Select(item => DailyJournalChecklistItem.Create(
                journal.Id,
                item.ConfigItemId,
                item.Label,
                item.Sequence,
                item.IsChecked))
            .ToList();
        journal.ReplaceChecklistItems(checklistItems);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return DailyJournalResponse.FromEntity(journal);
    }
}
