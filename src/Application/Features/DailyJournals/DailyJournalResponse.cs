using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalResponse(
    Guid Id,
    Guid UserId,
    DateTime JournalDateUtc,
    string TradeIdea,
    string Reflection,
    string Note,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc)
{
    public static DailyJournalResponse FromEntity(DailyJournal journal) =>
        new(
            journal.Id,
            journal.UserId,
            journal.JournalDateUtc,
            journal.TradeIdea,
            journal.Reflection,
            journal.Note,
            journal.CreatedAtUtc,
            journal.UpdatedAtUtc);
}
