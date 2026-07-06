using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class DailyJournalScreenshotConfiguration : IEntityTypeConfiguration<DailyJournalScreenshot>
{
    public void Configure(EntityTypeBuilder<DailyJournalScreenshot> builder)
    {
        builder.ToTable("daily_journal_screenshots");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.DailyJournalId)
            .HasColumnName("daily_journal_id")
            .IsRequired();

        builder.Property(s => s.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(s => s.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(s => s.FileName)
            .HasColumnName("file_name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(s => s.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.DownloadUrl)
            .HasColumnName("download_url")
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(s => s.ExpiresAtUtc)
            .HasColumnName("expires_at_utc")
            .IsRequired();

        builder.Property(s => s.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.HasIndex(s => new { s.DailyJournalId, s.CreatedAtUtc });

        builder.HasOne(s => s.DailyJournal)
            .WithMany(j => j.Screenshots)
            .HasForeignKey(s => s.DailyJournalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}