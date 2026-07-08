using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed class GetDailyJournalsUseCase(
    IDailyJournalRepository dailyJournalRepository,
    ITradeRepository tradeRepository)
{
    public async Task<IReadOnlyCollection<DailyJournalListItemResponse>> ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var journals = await dailyJournalRepository.GetAllByUserIdAsync(userId, cancellationToken);
        if (journals.Count == 0)
        {
            return [];
        }

        var minDate = journals.Min(j => j.JournalDateUtc).Date;
        var maxDateExclusive = journals.Max(j => j.JournalDateUtc).Date.AddDays(1);

        var trades = await tradeRepository.GetByUserIdWithinDateRangeAsync(
            userId,
            minDate,
            maxDateExclusive,
            cancellationToken);

        var tradesByDate = trades
            .GroupBy(t => DateOnly.FromDateTime(t.OpenTimeUtc))
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyCollection<Trade>)g.ToList());

        return journals
            .Select(journal =>
            {
                var dateKey = DateOnly.FromDateTime(journal.JournalDateUtc);
                tradesByDate.TryGetValue(dateKey, out var journalTrades);

                return DailyJournalListItemResponse.FromEntity(journal, journalTrades ?? []);
            })
            .ToList();
    }
}
