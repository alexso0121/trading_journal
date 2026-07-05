using trading_journel_app.Application.Repositories;

namespace trading_journel_app.Application.Features.DailyJournals;

public sealed class GetDailyJournalsUseCase(IDailyJournalRepository dailyJournalRepository)
{
    public async Task<IReadOnlyCollection<DailyJournalResponse>> ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var journals = await dailyJournalRepository.GetAllByUserIdAsync(userId, cancellationToken);
        return journals.Select(DailyJournalResponse.FromEntity).ToList();
    }
}
