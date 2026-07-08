using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed class GetDailyJournalDetailUseCase(
    IDailyJournalRepository dailyJournalRepository,
    ITradeRepository tradeRepository)
{
    public async Task<DailyJournalDetailResponse?> ExecuteAsync(
        Guid userId,
        Guid? journalId,
        DateTime? journalDateUtc,
        CancellationToken cancellationToken)
    {
        var journal = await ResolveJournalAsync(userId, journalId, journalDateUtc, cancellationToken);
        if (journal is null)
        {
            return null;
        }

        var trades = await tradeRepository.GetByUserIdAndDateAsync(userId, journal.JournalDateUtc, cancellationToken);
        return DailyJournalDetailResponse.FromEntity(journal, trades);
    }

    private async Task<Domain.Entities.DailyJournal?> ResolveJournalAsync(
        Guid userId,
        Guid? journalId,
        DateTime? journalDateUtc,
        CancellationToken cancellationToken)
    {
        if (journalId.HasValue)
        {
            var byId = await dailyJournalRepository.GetByIdAsync(journalId.Value, cancellationToken);
            return byId is not null && byId.UserId == userId ? byId : null;
        }

        if (!journalDateUtc.HasValue)
        {
            return null;
        }

        var normalizedDateUtc = journalDateUtc.Value.Kind switch
        {
            DateTimeKind.Utc => journalDateUtc.Value.Date,
            DateTimeKind.Local => journalDateUtc.Value.ToUniversalTime().Date,
            _ => DateTime.SpecifyKind(journalDateUtc.Value.Date, DateTimeKind.Utc),
        };

        return await dailyJournalRepository.GetByUserIdAndDateAsync(userId, normalizedDateUtc, cancellationToken);
    }
}