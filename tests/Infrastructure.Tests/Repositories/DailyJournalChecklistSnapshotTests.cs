using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Features.ChecklistSettings;
using trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Repositories;
using trading_journel_app.tests.Fixtures;
using Xunit;

namespace trading_journel_app.tests.Infrastructure.Tests.Repositories;

public sealed class DailyJournalChecklistSnapshotTests : IClassFixture<PostgreSqlFixture>
{
    private readonly TradingJournalDbContext _dbContext;
    private readonly ChecklistConfigRepository _checklistRepository;
    private readonly DailyJournalRepository _journalRepository;

    public DailyJournalChecklistSnapshotTests(PostgreSqlFixture fixture)
    {
        var options = new DbContextOptionsBuilder<TradingJournalDbContext>()
            .UseNpgsql(fixture.GetConnectionString())
            .Options;

        _dbContext = new TradingJournalDbContext(options);
        _dbContext.Database.EnsureCreated();
        _checklistRepository = new ChecklistConfigRepository(_dbContext);
        _journalRepository = new DailyJournalRepository(_dbContext);
    }

    [Fact]
    public async Task DeleteConfigItem_ShouldKeepHistoricalJournalChecklistSnapshot()
    {
        var userId = Guid.NewGuid();

        var createChecklistUseCase = new CreateChecklistConfigItemUseCase(_checklistRepository, _dbContext);
        var deleteChecklistUseCase = new DeleteChecklistConfigItemUseCase(_checklistRepository, _dbContext);
        var createJournalUseCase = new CreateDailyJournalUseCase(_journalRepository, _dbContext);

        var configItem = await createChecklistUseCase.ExecuteAsync(
            userId,
            new CreateChecklistConfigItemRequest { Label = "Review entry and stop" },
            CancellationToken.None);

        var journal = await createJournalUseCase.ExecuteAsync(
            userId,
            new CreateDailyJournalRequest
            {
                JournalDateUtc = new DateTime(2026, 7, 8, 0, 0, 0, DateTimeKind.Utc),
                TradeIdea = string.Empty,
                Reflection = string.Empty,
                ChecklistItems =
                [
                    new()
                    {
                        ConfigItemId = configItem.Id,
                        Label = configItem.Label,
                        Sequence = 1,
                        IsChecked = true,
                    },
                ],
            },
            CancellationToken.None);

        var deleted = await deleteChecklistUseCase.ExecuteAsync(userId, configItem.Id, CancellationToken.None);
        Assert.True(deleted);

        var storedJournal = await _journalRepository.GetByIdAsync(journal.Id, CancellationToken.None);
        Assert.NotNull(storedJournal);
        Assert.Single(storedJournal!.ChecklistItems);

        var snapshot = storedJournal.ChecklistItems.Single();
        Assert.Equal("Review entry and stop", snapshot.LabelSnapshot);
        Assert.Null(snapshot.ConfigItemId);
        Assert.True(snapshot.IsChecked);
    }
}