using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class StrategyTagConfiguration : IEntityTypeConfiguration<StrategyTag>
{
    public void Configure(EntityTypeBuilder<StrategyTag> builder)
    {
        builder.ToTable("strategy_tags");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");

        builder.Property(t => t.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(t => t.Name)
            .HasColumnName("name")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(t => t.NormalizedName)
            .HasColumnName("normalized_name")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(t => t.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.HasIndex(t => new { t.UserId, t.NormalizedName }).IsUnique();
    }
}