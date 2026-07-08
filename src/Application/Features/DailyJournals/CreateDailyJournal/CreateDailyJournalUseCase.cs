using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;

public sealed class CreateDailyJournalUseCase(IDailyJournalRepository dailyJournalRepository, IUnitOfWork unitOfWork)
{
    public async Task<DailyJournalResponse> ExecuteAsync(Guid userId, CreateDailyJournalRequest request, CancellationToken cancellationToken)
    {
        var dailyJournal = DailyJournal.Create(
            userId,
            request.JournalDateUtc,
            request.TradeIdea,
            request.Reflection,
            request.ChecklistItems.Count > 0);

        var checklistItems = request.ChecklistItems
            .OrderBy(i => i.Sequence)
            .Select(item => DailyJournalChecklistItem.Create(
                dailyJournal.Id,
                item.ConfigItemId,
                item.Label,
                item.Sequence,
                item.IsChecked))
            .ToList();
        dailyJournal.ReplaceChecklistItems(checklistItems);

        await dailyJournalRepository.AddAsync(dailyJournal, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return DailyJournalResponse.FromEntity(dailyJournal);
    }
}
