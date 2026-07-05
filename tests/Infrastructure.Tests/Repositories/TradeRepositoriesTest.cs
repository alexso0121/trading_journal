using Microsoft.EntityFrameworkCore;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Domain.Enums;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Repositories;
using trading_journel_app.tests.Fixtures;
using Xunit;


namespace trading_journel_app.tests.Infrastructure.Tests.Repositories;

public class TradeRepositoriesTest:IClassFixture<PostgreSqlFixture>
{
    private readonly PostgreSqlFixture _fixture;
    private readonly TradingJournalDbContext _dbContext;
    private readonly TradeRepository _tradeRepository;
    
    public TradeRepositoriesTest(PostgreSqlFixture fixture)
    {
        _fixture = fixture;
        var options = new DbContextOptionsBuilder<TradingJournalDbContext>()
            .UseNpgsql(_fixture.GetConnectionString())
            .Options;
        _dbContext = new TradingJournalDbContext(options);
        _tradeRepository = new TradeRepository(_dbContext);
    }
    
    
    [Fact]
    public async Task AddTrade_ShouldAddTradeToDatabase()
    {
        // Arrange
        var trade = Trade.Create(
             Guid.NewGuid(),
                Guid.NewGuid(),
             "AAPL",
             "NAS",
             TradeDirection.Long,
             13,
             3,
             new DateTime(2024, 6, 1, 14, 30, 0, DateTimeKind.Utc)
             
      
        );

        // Act
        await _tradeRepository.AddAsync(trade, CancellationToken.None);
        await _dbContext.SaveChangesAsync();

        // Assert
        var addedTrade = await _tradeRepository.GetByIdAsync(trade.Id, CancellationToken.None);
        Assert.NotNull(addedTrade);
        Assert.Equal(trade.Id, addedTrade!.Id);
        Assert.Equal(trade.UserId, addedTrade.UserId);
        Assert.Equal(trade.StrategyId, addedTrade.StrategyId);
    }
}