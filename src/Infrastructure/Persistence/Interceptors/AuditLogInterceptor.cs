using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using trading_journel_app.Infrastructure.Persistence.Entities;

namespace trading_journel_app.Infrastructure.Persistence.Interceptors;

public sealed class AuditLogInterceptor : SaveChangesInterceptor
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        AddAuditLogs(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        AddAuditLogs(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void AddAuditLogs(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var entries = context.ChangeTracker.Entries()
            .Where(entry =>
                entry.Entity is not AuditLogEntry &&
                entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0)
        {
            return;
        }

        var logs = new List<AuditLogEntry>();
        foreach (var entry in entries)
        {
            var log = CreateLog(entry);
            if (log is not null)
            {
                logs.Add(log);
            }
        }

        if (logs.Count > 0)
        {
            context.Set<AuditLogEntry>().AddRange(logs);
        }
    }

    private static AuditLogEntry? CreateLog(EntityEntry entry)
    {
        var entityType = entry.Metadata.ClrType.Name;
        var eventType = entry.State switch
        {
            EntityState.Added => "Created",
            EntityState.Modified => "Updated",
            EntityState.Deleted => "Deleted",
            _ => null
        };

        if (eventType is null)
        {
            return null;
        }

        if (!TryReadGuidProperty(entry.Entity, "Id", out var entityId))
        {
            return null;
        }

        if (!TryReadGuidProperty(entry.Entity, "UserId", out var userId))
        {
            userId = Guid.Empty;
        }

        int? version = TryReadIntProperty(entry.Entity, "Version", out var versionValue) ? versionValue : null;
        var payload = BuildPayload(entry);

        return AuditLogEntry.Create(
            entityId,
            entityType,
            eventType,
            userId,
            version,
            payload,
            DateTime.UtcNow);
    }

    private static string BuildPayload(EntityEntry entry)
    {
        if (entry.State == EntityState.Added)
        {
            var current = entry.Properties
                .Where(property => !property.Metadata.IsForeignKey())
                .ToDictionary(property => property.Metadata.Name, property => property.CurrentValue);
            return JsonSerializer.Serialize(new { state = "Added", current }, JsonOptions);
        }

        if (entry.State == EntityState.Deleted)
        {
            var original = entry.Properties
                .Where(property => !property.Metadata.IsForeignKey())
                .ToDictionary(property => property.Metadata.Name, property => property.OriginalValue);
            return JsonSerializer.Serialize(new { state = "Deleted", original }, JsonOptions);
        }

        var changes = entry.Properties
            .Where(property => property.IsModified && !property.Metadata.IsForeignKey())
            .Select(property => new
            {
                property.Metadata.Name,
                Original = property.OriginalValue,
                Current = property.CurrentValue
            })
            .ToList();

        return JsonSerializer.Serialize(new { state = "Updated", changes }, JsonOptions);
    }

    private static bool TryReadGuidProperty(object target, string propertyName, out Guid value)
    {
        var property = target.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public);
        if (property?.PropertyType != typeof(Guid))
        {
            value = Guid.Empty;
            return false;
        }

        var raw = property.GetValue(target);
        if (raw is Guid guid)
        {
            value = guid;
            return true;
        }

        value = Guid.Empty;
        return false;
    }

    private static bool TryReadIntProperty(object target, string propertyName, out int value)
    {
        var property = target.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public);
        if (property?.PropertyType != typeof(int))
        {
            value = default;
            return false;
        }

        var raw = property.GetValue(target);
        if (raw is int intValue)
        {
            value = intValue;
            return true;
        }

        value = default;
        return false;
    }
}
