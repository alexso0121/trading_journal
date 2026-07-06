using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Configurations;

public sealed class StrategyConfiguration : IEntityTypeConfiguration<Strategy>
{
    public void Configure(EntityTypeBuilder<Strategy> builder)
    {
        builder.ToTable("strategies");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");

        builder.Property(s => s.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasColumnName("description")
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(s => s.Version)
            .HasColumnName("version")
            .HasDefaultValue(1)
            .IsConcurrencyToken()
            .IsRequired();

        builder.Property(s => s.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(s => s.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .IsRequired();

        builder.HasMany(s => s.Trades)
            .WithOne(t => t.Strategy)
            .HasForeignKey(t => t.StrategyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Tags)
            .WithMany(t => t.Strategies)
            .UsingEntity<Dictionary<string, object>>(
                "strategy_tag_mappings",
                join => join
                    .HasOne<StrategyTag>()
                    .WithMany()
                    .HasForeignKey("strategy_tag_id")
                    .OnDelete(DeleteBehavior.Cascade),
                join => join
                    .HasOne<Strategy>()
                    .WithMany()
                    .HasForeignKey("strategy_id")
                    .OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.ToTable("strategy_tag_mappings");
                    join.HasKey("strategy_id", "strategy_tag_id");
                });
    }
}
