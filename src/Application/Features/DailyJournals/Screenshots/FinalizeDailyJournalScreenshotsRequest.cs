namespace trading_journel_app.Application.Features.DailyJournals.Screenshots;

public sealed class FinalizeDailyJournalScreenshotsRequest
{
    public IReadOnlyCollection<string> StorageKeys { get; init; } = [];
}