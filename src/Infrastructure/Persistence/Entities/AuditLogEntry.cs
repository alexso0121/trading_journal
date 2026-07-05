namespace trading_journel_app.Infrastructure.Persistence.Entities;

public sealed class AuditLogEntry
{
    private AuditLogEntry()
    {
    }

    private AuditLogEntry(
        Guid entityId,
        string entityType,
        string eventType,
        Guid userId,
        int? version,
        string payloadJson,
        DateTime occurredAtUtc)
    {
        Id = Guid.NewGuid();
        EntityId = entityId;
        EntityType = entityType;
        EventType = eventType;
        UserId = userId;
        Version = version;
        PayloadJson = payloadJson;
        OccurredAtUtc = occurredAtUtc;
    }

    public Guid Id { get; private set; }
    public Guid EntityId { get; private set; }
    public string EntityType { get; private set; } = string.Empty;
    public string EventType { get; private set; } = string.Empty;
    public Guid UserId { get; private set; }
    public int? Version { get; private set; }
    public string PayloadJson { get; private set; } = string.Empty;
    public DateTime OccurredAtUtc { get; private set; }

    public static AuditLogEntry Create(
        Guid entityId,
        string entityType,
        string eventType,
        Guid userId,
        int? version,
        string payloadJson,
        DateTime occurredAtUtc) =>
        new(entityId, entityType, eventType, userId, version, payloadJson, occurredAtUtc);
}
