namespace trading_journel_app.Domain.Entities;

public sealed class DailyJournalChecklistItem
{
    private DailyJournalChecklistItem()
    {
    }

    private DailyJournalChecklistItem(
        Guid dailyJournalId,
        Guid? configItemId,
        string labelSnapshot,
        int sequence,
        bool isChecked)
    {
        Id = Guid.NewGuid();
        DailyJournalId = dailyJournalId;
        ConfigItemId = configItemId;
        LabelSnapshot = labelSnapshot.Trim();
        Sequence = sequence;
        IsChecked = isChecked;
        CheckedAtUtc = isChecked ? DateTime.UtcNow : null;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid DailyJournalId { get; private set; }
    public Guid? ConfigItemId { get; private set; }
    public string LabelSnapshot { get; private set; } = string.Empty;
    public int Sequence { get; private set; }
    public bool IsChecked { get; private set; }
    public DateTime? CheckedAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static DailyJournalChecklistItem Create(
        Guid dailyJournalId,
        Guid? configItemId,
        string labelSnapshot,
        int sequence,
        bool isChecked)
    {
        if (dailyJournalId == Guid.Empty) throw new ArgumentException("DailyJournalId is required.", nameof(dailyJournalId));
        if (string.IsNullOrWhiteSpace(labelSnapshot)) throw new ArgumentException("LabelSnapshot is required.", nameof(labelSnapshot));
        if (sequence < 1) throw new ArgumentOutOfRangeException(nameof(sequence), "Sequence must be greater than 0.");

        var trimmed = labelSnapshot.Trim();
        if (trimmed.Length > 200)
            throw new ArgumentOutOfRangeException(nameof(labelSnapshot), "LabelSnapshot must be at most 200 characters.");

        return new DailyJournalChecklistItem(dailyJournalId, configItemId, trimmed, sequence, isChecked);
    }
}