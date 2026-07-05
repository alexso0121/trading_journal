namespace trading_journel_app.Domain.Entities;

public sealed class DailyJournal
{
    private DailyJournal()
    {
    }

    private DailyJournal(Guid userId, DateTime journalDateUtc, string note)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        JournalDateUtc = journalDateUtc.Date;
        Note = note.Trim();
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JournalDateUtc { get; private set; }
    public string Note { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public static DailyJournal Create(Guid userId, DateTime journalDateUtc, string note)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(note)) throw new ArgumentException("Note is required.", nameof(note));

        return new DailyJournal(userId, journalDateUtc, note);
    }

    public void Update(DateTime journalDateUtc, string note)
    {
        if (string.IsNullOrWhiteSpace(note)) throw new ArgumentException("Note is required.", nameof(note));

        JournalDateUtc = journalDateUtc.Date;
        Note = note.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
