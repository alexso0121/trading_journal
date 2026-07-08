using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence.Entities;

namespace trading_journel_app.Infrastructure.Persistence;

public sealed class TradingJournalDbContext(DbContextOptions<TradingJournalDbContext> options)
    : DbContext(options), IUnitOfWork
{
    public DbSet<ChecklistConfigItem> ChecklistConfigItems => Set<ChecklistConfigItem>();
    public DbSet<DailyJournal> DailyJournals => Set<DailyJournal>();
    public DbSet<DailyJournalChecklistItem> DailyJournalChecklistItems => Set<DailyJournalChecklistItem>();
    public DbSet<StoredFile> StoredFiles => Set<StoredFile>();
    public DbSet<Strategy> Strategies => Set<Strategy>();
    public DbSet<StrategyTag> StrategyTags => Set<StrategyTag>();
    public DbSet<Trade> Trades => Set<Trade>();
    public DbSet<AuditLogEntry> AuditLogs => Set<AuditLogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TradingJournalDbContext).Assembly);
    }

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
    {
        await using var transaction = await Database.BeginTransactionAsync(cancellationToken);

        try
        {
            await action(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
