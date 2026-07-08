using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Features.Analytics;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Domain.Enums;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Repositories;
using trading_journel_app.tests.Fixtures;
using Xunit;

namespace trading_journel_app.tests.Infrastructure.Tests.Repositories;

public sealed class TradeAnalyticsSummaryUseCaseTests : IClassFixture<PostgreSqlFixture>
{
    private readonly TradingJournalDbContext _dbContext;
    private readonly TradeRepository _tradeRepository;

    public TradeAnalyticsSummaryUseCaseTests(PostgreSqlFixture fixture)
    {
        var options = new DbContextOptionsBuilder<TradingJournalDbContext>()
            .UseNpgsql(fixture.GetConnectionString())
            .Options;

        _dbContext = new TradingJournalDbContext(options);
        _dbContext.Database.EnsureCreated();
        _tradeRepository = new TradeRepository(_dbContext);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldComputeTradeAnalyticsSummaryFromSeededTrades()
    {
        var userId = Guid.NewGuid();
        var strategy = Strategy.Create(userId, "Analytics", "Analytics strategy");
        _dbContext.Strategies.Add(strategy);
        await _dbContext.SaveChangesAsync();

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
                40,
                string.Empty,
                new DateTime(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc)),
            Trade.Create(
                strategy.Id,
                userId,
                "AAPL",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Long,
                110,
                1,
                -10,
                string.Empty,
                new DateTime(2026, 7, 2, 12, 0, 0, DateTimeKind.Utc)),
            Trade.Create(
                strategy.Id,
                userId,
                "MSFT",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Short,
                200,
                1,
                15,
                string.Empty,
                new DateTime(2026, 7, 3, 12, 0, 0, DateTimeKind.Utc)));
        await _dbContext.SaveChangesAsync();

        var useCase = new GetTradeAnalyticsSummaryUseCase(_tradeRepository);
        var summary = await useCase.ExecuteAsync(userId, null, null, CancellationToken.None);

        Assert.Equal(3, summary.TotalTrades);
        Assert.Equal(2, summary.WinningTrades);
        Assert.Equal(1, summary.LosingTrades);
        Assert.Equal(45, summary.NetPnl);
        Assert.Equal(15, summary.AveragePnl);
        Assert.Equal(40, summary.BestTradePnl);
        Assert.Equal(-10, summary.WorstTradePnl);
        Assert.Equal(66.66666666666666666666666667m, summary.WinRatePercent);
        Assert.Equal(2, summary.TopSymbols.Count);
        Assert.Equal("AAPL", summary.TopSymbols.First().Symbol);
        Assert.Equal(30, summary.TopSymbols.First().NetPnl);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldReturnZerosForEmptyPortfolio()
    {
        var useCase = new GetTradeAnalyticsSummaryUseCase(_tradeRepository);
        var summary = await useCase.ExecuteAsync(Guid.NewGuid(), null, null, CancellationToken.None);

        Assert.Equal(0, summary.TotalTrades);
        Assert.Equal(0, summary.NetPnl);
        Assert.Empty(summary.TopSymbols);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldRespectInclusiveDateRangeFilter()
    {
        var userId = Guid.NewGuid();
        var strategy = Strategy.Create(userId, "Date range", "Date filter strategy");
        _dbContext.Strategies.Add(strategy);
        await _dbContext.SaveChangesAsync();

        _dbContext.Trades.AddRange(
            Trade.Create(
                strategy.Id,
                userId,
                "AMD",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Long,
                90,
                1,
                10,
                string.Empty,
                new DateTime(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc)),
            Trade.Create(
                strategy.Id,
                userId,
                "INTC",
                "NASDAQ",
                TradeAsset.Stock,
                TradeDirection.Long,
                30,
                2,
                -5,
                string.Empty,
                new DateTime(2026, 7, 3, 12, 0, 0, DateTimeKind.Utc)));
        await _dbContext.SaveChangesAsync();

        var useCase = new GetTradeAnalyticsSummaryUseCase(_tradeRepository);
        var summary = await useCase.ExecuteAsync(
            userId,
            new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
            CancellationToken.None);

        Assert.Equal(1, summary.TotalTrades);
        Assert.Equal(10, summary.NetPnl);
        Assert.Single(summary.TopSymbols);
        Assert.Equal("AMD", summary.TopSymbols.Single().Symbol);
    }
}
