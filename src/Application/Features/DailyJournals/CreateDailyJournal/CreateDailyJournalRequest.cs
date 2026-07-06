namespace trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;

public sealed class CreateDailyJournalRequest
{
    public DateTime JournalDateUtc { get; init; }
    public string TradeIdea { get; init; } = string.Empty;
    public string Reflection { get; init; } = string.Empty;
}
