using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalDetailResponse(
    Guid Id,
    Guid UserId,
    DateTime JournalDateUtc,
    string TradeIdea,
    string Reflection,
    string Note,
    IReadOnlyCollection<DailyJournalChecklistItemResponse> ChecklistItems,
    IReadOnlyCollection<DailyJournalTradeResponse> Trades,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc)
{
    public static DailyJournalDetailResponse FromEntity(
        DailyJournal journal,
        IReadOnlyCollection<Trade> trades) =>
        new(
            journal.Id,
            journal.UserId,
            journal.JournalDateUtc,
            journal.TradeIdea,
            journal.Reflection,
            journal.Note,
            journal.ChecklistItems
                .OrderBy(i => i.Sequence)
                .Select(DailyJournalChecklistItemResponse.FromEntity)
                .ToList(),
            trades
                .OrderByDescending(t => t.OpenTimeUtc)
                .Select(DailyJournalTradeResponse.FromEntity)
                .ToList(),
            journal.CreatedAtUtc,
            journal.UpdatedAtUtc);
}