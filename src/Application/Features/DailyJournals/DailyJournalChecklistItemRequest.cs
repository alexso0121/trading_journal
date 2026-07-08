namespace trading_journel_app.Application.Features.DailyJournals;

public sealed class DailyJournalChecklistItemRequest
{
    public Guid? ConfigItemId { get; init; }
    public string Label { get; init; } = string.Empty;
    public int Sequence { get; init; }
    public bool IsChecked { get; init; }
}