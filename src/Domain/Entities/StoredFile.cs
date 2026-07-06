using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Domain.Entities;

public sealed class StoredFile
{
    private StoredFile()
    {
    }

    private StoredFile(
        Guid userId,
        StoredFileOwnerType ownerType,
        string fileName,
        string contentType,
        string storageKey)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        OwnerType = ownerType;
        FileName = fileName.Trim();
        ContentType = contentType.Trim();
        StorageKey = storageKey.Trim();
        Status = StoredFileStatus.Temp;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public StoredFileOwnerType OwnerType { get; private set; }
    public Guid? OwnerEntityId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public string StorageKey { get; private set; } = string.Empty;
    public StoredFileStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static StoredFile CreateTemp(
        Guid userId,
        StoredFileOwnerType ownerType,
        string fileName,
        string contentType,
        string storageKey)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required.", nameof(userId));
        }

        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("FileName is required.", nameof(fileName));
        }

        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("ContentType is required.", nameof(contentType));
        }

        if (string.IsNullOrWhiteSpace(storageKey))
        {
            throw new ArgumentException("StorageKey is required.", nameof(storageKey));
        }

        return new StoredFile(userId, ownerType, fileName, contentType, storageKey);
    }

    public void Activate(Guid ownerEntityId, string storageKey)
    {
        if (ownerEntityId == Guid.Empty)
        {
            throw new ArgumentException("OwnerEntityId is required.", nameof(ownerEntityId));
        }

        if (string.IsNullOrWhiteSpace(storageKey))
        {
            throw new ArgumentException("StorageKey is required.", nameof(storageKey));
        }

        OwnerEntityId = ownerEntityId;
        StorageKey = storageKey.Trim();
        Status = StoredFileStatus.Active;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
