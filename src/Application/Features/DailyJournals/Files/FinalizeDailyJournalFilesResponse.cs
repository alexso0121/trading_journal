namespace trading_journel_app.Application.Features.DailyJournals.Files;

public sealed record FinalizeDailyJournalFilesResponse(IReadOnlyCollection<FinalizeDailyJournalFileItem> Items);

public sealed record FinalizeDailyJournalFileItem(
    Guid FileId,
    string DownloadUrl,
    DateTime ExpiresAtUtc);
