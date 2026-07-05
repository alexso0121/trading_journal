namespace trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

public sealed class UpdateDailyJournalRequest
{
    public DateTime JournalDateUtc { get; init; }
    public string Note { get; init; } = string.Empty;
}
