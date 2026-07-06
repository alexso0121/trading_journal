namespace trading_journel_app.Domain.Entities;

public sealed class DailyJournalScreenshot
{
    private DailyJournalScreenshot()
    {
    }

    private DailyJournalScreenshot(
        Guid dailyJournalId,
        Guid userId,
        string storageKey,
        string fileName,
        string contentType,
        string downloadUrl,
        DateTime expiresAtUtc)
    {
        Id = Guid.NewGuid();
        DailyJournalId = dailyJournalId;
        UserId = userId;
        StorageKey = storageKey.Trim();
        FileName = fileName.Trim();
        ContentType = contentType.Trim();
        DownloadUrl = downloadUrl.Trim();
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid DailyJournalId { get; private set; }
    public Guid UserId { get; private set; }
    public string StorageKey { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public string DownloadUrl { get; private set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DailyJournal DailyJournal { get; private set; } = null!;

    public static DailyJournalScreenshot Create(
        Guid dailyJournalId,
        Guid userId,
        string storageKey,
        string fileName,
        string contentType,
        string downloadUrl,
        DateTime expiresAtUtc)
    {
        if (dailyJournalId == Guid.Empty) throw new ArgumentException("DailyJournalId is required.", nameof(dailyJournalId));
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(storageKey)) throw new ArgumentException("StorageKey is required.", nameof(storageKey));
        if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentException("FileName is required.", nameof(fileName));
        if (string.IsNullOrWhiteSpace(contentType)) throw new ArgumentException("ContentType is required.", nameof(contentType));
        if (string.IsNullOrWhiteSpace(downloadUrl)) throw new ArgumentException("DownloadUrl is required.", nameof(downloadUrl));

        return new DailyJournalScreenshot(
            dailyJournalId,
            userId,
            storageKey,
            fileName,
            contentType,
            downloadUrl,
            expiresAtUtc);
    }
}