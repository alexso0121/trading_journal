using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalListItemResponse(
    Guid Id,
    DateTime JournalDateUtc,
    IReadOnlyCollection<DailyJournalTradeResponse> Trades,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc)
{
    public static DailyJournalListItemResponse FromEntity(
        DailyJournal journal,
        IReadOnlyCollection<Trade> trades) =>
        new(
            journal.Id,
            journal.JournalDateUtc,
            trades
                .OrderByDescending(t => t.OpenTimeUtc)
                .Select(DailyJournalTradeResponse.FromEntity)
                .ToList(),
            journal.CreatedAtUtc,
            journal.UpdatedAtUtc);
}