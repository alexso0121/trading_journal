using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed class GetDailyJournalByIdUseCase(IDailyJournalRepository dailyJournalRepository)
{
    public async Task<DailyJournalResponse?> ExecuteAsync(Guid journalId, CancellationToken cancellationToken)
    {
        var journal = await dailyJournalRepository.GetByIdAsync(journalId, cancellationToken);
        return journal is null ? null : DailyJournalResponse.FromEntity(journal);
    }
}
