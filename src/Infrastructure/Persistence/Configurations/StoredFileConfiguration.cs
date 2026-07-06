using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class StoredFileConfiguration : IEntityTypeConfiguration<StoredFile>
{
    public void Configure(EntityTypeBuilder<StoredFile> builder)
    {
        builder.ToTable("stored_files");

        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasColumnName("id");

        builder.Property(f => f.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(f => f.OwnerType)
            .HasColumnName("owner_type")
            .IsRequired();

        builder.Property(f => f.OwnerEntityId)
            .HasColumnName("owner_entity_id");

        builder.Property(f => f.FileName)
            .HasColumnName("file_name")
            .HasMaxLength(260)
            .IsRequired();

        builder.Property(f => f.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(f => f.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(1024)
            .IsRequired();

        builder.Property(f => f.Status)
            .HasColumnName("status")
            .IsRequired();

        builder.Property(f => f.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(f => f.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .IsRequired();

        builder.HasIndex(f => new { f.UserId, f.Status });
        builder.HasIndex(f => new { f.UserId, f.OwnerType, f.OwnerEntityId });
    }
}
