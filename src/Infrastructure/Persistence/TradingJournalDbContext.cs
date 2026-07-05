using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Domain.Entities;
using trading_journel_app.Infrastructure.Persistence.Entities;

namespace trading_journel_app.Infrastructure.Persistence;

public sealed class TradingJournalDbContext(DbContextOptions<TradingJournalDbContext> options)
    : DbContext(options), IUnitOfWork
{
    public DbSet<DailyJournal> DailyJournals => Set<DailyJournal>();
    public DbSet<Strategy> Strategies => Set<Strategy>();
    public DbSet<Trade> Trades => Set<Trade>();
    public DbSet<AuditLogEntry> AuditLogs => Set<AuditLogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TradingJournalDbContext).Assembly);
    }
}
