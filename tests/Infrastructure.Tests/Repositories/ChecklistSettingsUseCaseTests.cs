using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Features.ChecklistSettings;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Repositories;
using trading_journel_app.tests.Fixtures;
using Xunit;

namespace trading_journel_app.tests.Infrastructure.Tests.Repositories;

public sealed class ChecklistSettingsUseCaseTests : IClassFixture<PostgreSqlFixture>
{
    private readonly TradingJournalDbContext _dbContext;
    private readonly ChecklistConfigRepository _repository;

    public ChecklistSettingsUseCaseTests(PostgreSqlFixture fixture)
    {
        var options = new DbContextOptionsBuilder<TradingJournalDbContext>()
            .UseNpgsql(fixture.GetConnectionString())
            .Options;

        _dbContext = new TradingJournalDbContext(options);
        _dbContext.Database.EnsureCreated();
        _repository = new ChecklistConfigRepository(_dbContext);
    }

    [Fact]
    public async Task ChecklistSettings_Create_Reorder_Delete_ShouldPersistExpectedOrder()
    {
        var userId = Guid.NewGuid();

        var createUseCase = new CreateChecklistConfigItemUseCase(_repository, _dbContext);
        var getUseCase = new GetChecklistConfigItemsUseCase(_repository);
        var reorderUseCase = new ReorderChecklistConfigItemsUseCase(_repository, _dbContext);
        var deleteUseCase = new DeleteChecklistConfigItemUseCase(_repository, _dbContext);

        var itemA = await createUseCase.ExecuteAsync(
            userId,
            new CreateChecklistConfigItemRequest { Label = "Pre-market prep" },
            CancellationToken.None);
        var itemB = await createUseCase.ExecuteAsync(
            userId,
            new CreateChecklistConfigItemRequest { Label = "Risk check" },
            CancellationToken.None);
        var itemC = await createUseCase.ExecuteAsync(
            userId,
            new CreateChecklistConfigItemRequest { Label = "Post-trade notes" },
            CancellationToken.None);

        var reordered = await reorderUseCase.ExecuteAsync(
            userId,
            new ReorderChecklistConfigItemsRequest
            {
                ItemIds = [itemC.Id, itemA.Id, itemB.Id],
            },
            CancellationToken.None);

        Assert.True(reordered);

        var orderedItems = await getUseCase.ExecuteAsync(userId, CancellationToken.None);
        Assert.Equal(3, orderedItems.Count);
        Assert.Equal(itemC.Id, orderedItems.ElementAt(0).Id);
        Assert.Equal(itemA.Id, orderedItems.ElementAt(1).Id);
        Assert.Equal(itemB.Id, orderedItems.ElementAt(2).Id);

        var deleted = await deleteUseCase.ExecuteAsync(userId, itemA.Id, CancellationToken.None);
        Assert.True(deleted);

        var afterDelete = await getUseCase.ExecuteAsync(userId, CancellationToken.None);
        Assert.Equal(2, afterDelete.Count);
        Assert.Equal(1, afterDelete.ElementAt(0).Sequence);
        Assert.Equal(2, afterDelete.ElementAt(1).Sequence);
    }
}