namespace trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;

public sealed class CreateDailyJournalRequest
{
    public DateTime JournalDateUtc { get; init; }
    public string Note { get; init; } = string.Empty;
}
