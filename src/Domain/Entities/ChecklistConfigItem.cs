namespace trading_journel_app.Domain.Entities;

public sealed class ChecklistConfigItem
{
    private ChecklistConfigItem()
    {
    }

    private ChecklistConfigItem(Guid userId, string label, int sequence)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Label = label.Trim();
        Sequence = sequence;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Label { get; private set; } = string.Empty;
    public int Sequence { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static ChecklistConfigItem Create(Guid userId, string label, int sequence)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(label)) throw new ArgumentException("Label is required.", nameof(label));
        if (sequence < 1) throw new ArgumentOutOfRangeException(nameof(sequence), "Sequence must be greater than 0.");

        var trimmed = label.Trim();
        if (trimmed.Length > 200) throw new ArgumentOutOfRangeException(nameof(label), "Label must be at most 200 characters.");

        return new ChecklistConfigItem(userId, trimmed, sequence);
    }

    public void SetSequence(int sequence)
    {
        if (sequence < 1) throw new ArgumentOutOfRangeException(nameof(sequence), "Sequence must be greater than 0.");

        Sequence = sequence;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}