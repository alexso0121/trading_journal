using trading_journel_app.Application.Features.DailyJournals;

namespace trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

public sealed class UpdateDailyJournalRequest
{
    public DateTime JournalDateUtc { get; init; }
    public string TradeIdea { get; init; } = string.Empty;
    public string Reflection { get; init; } = string.Empty;
    public IReadOnlyCollection<DailyJournalChecklistItemRequest> ChecklistItems { get; init; } = [];
}
