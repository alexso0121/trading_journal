using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed record DailyJournalChecklistItemResponse(
    Guid Id,
    Guid DailyJournalId,
    Guid? ConfigItemId,
    string Label,
    int Sequence,
    bool IsChecked,
    DateTime? CheckedAtUtc,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc)
{
    public static DailyJournalChecklistItemResponse FromEntity(DailyJournalChecklistItem item) =>
        new(
            item.Id,
            item.DailyJournalId,
            item.ConfigItemId,
            item.LabelSnapshot,
            item.Sequence,
            item.IsChecked,
            item.CheckedAtUtc,
            item.CreatedAtUtc,
            item.UpdatedAtUtc);
}