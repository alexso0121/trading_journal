namespace trading_journel_app.Application.Features.DailyJournals.Files;

public sealed class FinalizeDailyJournalFilesRequest
{
    public IReadOnlyCollection<Guid> FileIds { get; init; } = [];
}
