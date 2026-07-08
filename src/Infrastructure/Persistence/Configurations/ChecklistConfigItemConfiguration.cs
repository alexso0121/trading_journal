using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class ChecklistConfigItemConfiguration : IEntityTypeConfiguration<ChecklistConfigItem>
{
    public void Configure(EntityTypeBuilder<ChecklistConfigItem> builder)
    {
        builder.ToTable("checklist_config_items");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");

        builder.Property(i => i.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(i => i.Label)
            .HasColumnName("label")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Sequence)
            .HasColumnName("sequence")
            .IsRequired();

        builder.Property(i => i.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(i => i.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .IsRequired();

        builder.HasIndex(i => new { i.UserId, i.Sequence }).IsUnique();
    }
}