using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class DailyJournalChecklistItemConfiguration : IEntityTypeConfiguration<DailyJournalChecklistItem>
{
    public void Configure(EntityTypeBuilder<DailyJournalChecklistItem> builder)
    {
        builder.ToTable("daily_journal_checklist_items");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.DailyJournalId)
            .HasColumnName("daily_journal_id")
            .IsRequired();

        builder.Property(i => i.ConfigItemId)
            .HasColumnName("config_item_id");

        builder.Property(i => i.LabelSnapshot)
            .HasColumnName("label_snapshot")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Sequence)
            .HasColumnName("sequence")
            .IsRequired();

        builder.Property(i => i.IsChecked)
            .HasColumnName("is_checked")
            .IsRequired();

        builder.Property(i => i.CheckedAtUtc)
            .HasColumnName("checked_at_utc");

        builder.Property(i => i.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(i => i.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .IsRequired();

        builder.HasIndex(i => new { i.DailyJournalId, i.Sequence }).IsUnique();

        builder.HasOne<ChecklistConfigItem>()
            .WithMany()
            .HasForeignKey(i => i.ConfigItemId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}