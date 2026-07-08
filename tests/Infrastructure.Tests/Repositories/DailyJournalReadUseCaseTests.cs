using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Features.DailyJournals;
using trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Domain.Enums;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Repositories;
using trading_journel_app.tests.Fixtures;
using Xunit;

namespace trading_journel_app.tests.Infrastructure.Tests.Repositories;

public sealed class DailyJournalReadUseCaseTests : IClassFixture<PostgreSqlFixture>
{
    private readonly TradingJournalDbContext _dbContext;
    private readonly DailyJournalRepository _journalRepository;
    private readonly TradeRepository _tradeRepository;

    public DailyJournalReadUseCaseTests(PostgreSqlFixture fixture)
    {
        var options = new DbContextOptionsBuilder<TradingJournalDbContext>()
            .UseNpgsql(fixture.GetConnectionString())
            .Options;

        _dbContext = new TradingJournalDbContext(options);
        _dbContext.Database.EnsureCreated();
        _journalRepository = new DailyJournalRepository(_dbContext);
        _tradeRepository = new TradeRepository(_dbContext);
    }

    [Fact]
    public async Task GetDailyJournals_ShouldReturnLightweightTradeSummariesGroupedByJournalDate()
    {
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        var strategy = Strategy.Create(userId, "Breakout", "Main strategy");
        var otherUserStrategy = Strategy.Create(otherUserId, "Other", "Other strategy");
        _dbContext.Strategies.Add(strategy);
        _dbContext.Strategies.Add(otherUserStrategy);
        await _dbContext.SaveChangesAsync();

        var createJournalUseCase = new CreateDailyJournalUseCase(_journalRepository, _dbContext);

        await createJournalUseCase.ExecuteAsync(
            userId,
            new CreateDailyJournalRequest
            {
                JournalDateUtc = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
                TradeIdea = "Day 1 idea",
                Reflection = "Day 1 reflection",
            },
            CancellationToken.None);

        await createJournalUseCase.ExecuteAsync(
            userId,
            new CreateDailyJournalRequest
            {
                JournalDateUtc = new DateTime(2026, 7, 2, 0, 0, 0, DateTimeKind.Utc),
                TradeIdea = "Day 2 idea",
                Reflection = "Day 2 reflection",
            },
            CancellationToken.None);

        _dbContext.Trades.AddRange(
            Trade.Create(
                strategy.Id,
                userId,
                "AAPL",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Long,
                100,
                2,
                50,
                string.Empty,
                new DateTime(2026, 7, 1, 14, 0, 0, DateTimeKind.Utc)),
            Trade.Create(
                strategy.Id,
                userId,
                "MSFT",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Long,
                200,
                1,
                -10,
                string.Empty,
                new DateTime(2026, 7, 2, 15, 0, 0, DateTimeKind.Utc)),
            Trade.Create(
                otherUserStrategy.Id,
                otherUserId,
                "TSLA",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Short,
                300,
                1,
                99,
                string.Empty,
                new DateTime(2026, 7, 1, 16, 0, 0, DateTimeKind.Utc)));
        await _dbContext.SaveChangesAsync();

        var useCase = new GetDailyJournalsUseCase(_journalRepository, _tradeRepository);
        var list = await useCase.ExecuteAsync(userId, CancellationToken.None);

        Assert.Equal(2, list.Count);

        var day1 = list.Single(item => item.JournalDateUtc.Date == new DateTime(2026, 7, 1));
        Assert.Single(day1.Trades);
        Assert.Equal("AAPL", day1.Trades.Single().Symbol);
        Assert.Equal(50, day1.Trades.Single().Pnl);

        var day2 = list.Single(item => item.JournalDateUtc.Date == new DateTime(2026, 7, 2));
        Assert.Single(day2.Trades);
        Assert.Equal("MSFT", day2.Trades.Single().Symbol);
        Assert.Equal(-10, day2.Trades.Single().Pnl);
    }

    [Fact]
    public async Task GetDailyJournalDetail_ShouldResolveByDateAndReturnChecklistStateAndTradeSummaries()
    {
        var userId = Guid.NewGuid();

        var strategy = Strategy.Create(userId, "Reversal", "Reversal strategy");
        _dbContext.Strategies.Add(strategy);
        await _dbContext.SaveChangesAsync();

        var createJournalUseCase = new CreateDailyJournalUseCase(_journalRepository, _dbContext);
        await createJournalUseCase.ExecuteAsync(
            userId,
            new CreateDailyJournalRequest
            {
                JournalDateUtc = new DateTime(2026, 7, 8, 0, 0, 0, DateTimeKind.Utc),
                TradeIdea = "Wait for confirmation",
                Reflection = "Need tighter stop",
                ChecklistItems =
                [
                    new()
                    {
                        ConfigItemId = null,
                        Label = "Confirm risk/reward",
                        Sequence = 1,
                        IsChecked = true,
                    },
                ],
            },
            CancellationToken.None);

        _dbContext.Trades.Add(
            Trade.Create(
                strategy.Id,
                userId,
                "NVDA",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Long,
                500,
                1,
                25,
                string.Empty,
                new DateTime(2026, 7, 8, 13, 0, 0, DateTimeKind.Utc)));
        await _dbContext.SaveChangesAsync();

        var useCase = new GetDailyJournalDetailUseCase(_journalRepository, _tradeRepository);
        var detail = await useCase.ExecuteAsync(
            userId,
            null,
            new DateTime(2026, 7, 8, 0, 0, 0, DateTimeKind.Unspecified),
            CancellationToken.None);

        Assert.NotNull(detail);
        Assert.Equal("Wait for confirmation", detail!.TradeIdea);
        Assert.Equal("Need tighter stop", detail.Reflection);
        Assert.Single(detail.ChecklistItems);
        Assert.True(detail.ChecklistItems.Single().IsChecked);
        Assert.Equal("Confirm risk/reward", detail.ChecklistItems.Single().Label);
        Assert.Single(detail.Trades);
        Assert.Equal("NVDA", detail.Trades.Single().Symbol);
        Assert.Equal(25, detail.Trades.Single().Pnl);

        var missing = await useCase.ExecuteAsync(
            userId,
            null,
            new DateTime(2026, 7, 9, 0, 0, 0, DateTimeKind.Utc),
            CancellationToken.None);

        Assert.Null(missing);
    }
}