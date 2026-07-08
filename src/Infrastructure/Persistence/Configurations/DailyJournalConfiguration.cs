using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class DailyJournalConfiguration : IEntityTypeConfiguration<DailyJournal>
{
    public void Configure(EntityTypeBuilder<DailyJournal> builder)
    {
        builder.ToTable("daily_journals");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).HasColumnName("id");

        builder.Property(j => j.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(j => j.JournalDateUtc)
            .HasColumnName("journal_date_utc")
            .IsRequired();

        builder.Property(j => j.TradeIdea)
            .HasColumnName("trade_idea")
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(j => j.Reflection)
            .HasColumnName("reflection")
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(j => j.Note)
            .HasColumnName("note")
            .HasMaxLength(8000)
            .IsRequired();

        builder.Property(j => j.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(j => j.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .IsRequired();

        builder.HasIndex(j => new { j.UserId, j.JournalDateUtc })
            .IsUnique();

        builder.HasMany(j => j.ChecklistItems)
            .WithOne()
            .HasForeignKey(i => i.DailyJournalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
