namespace trading_journel_app.Domain.Entities;

public sealed class DailyJournal
{
    private DailyJournal()
    {
    }

    private DailyJournal(Guid userId, DateTime journalDateUtc, string tradeIdea, string reflection)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        JournalDateUtc = journalDateUtc.Date;
        TradeIdea = tradeIdea.Trim();
        Reflection = reflection.Trim();
        Note = BuildLegacyNote(TradeIdea, Reflection);
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JournalDateUtc { get; private set; }
    public string TradeIdea { get; private set; } = string.Empty;
    public string Reflection { get; private set; } = string.Empty;
    public string Note { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public ICollection<DailyJournalChecklistItem> ChecklistItems { get; } = new List<DailyJournalChecklistItem>();

    public static DailyJournal Create(Guid userId, DateTime journalDateUtc, string tradeIdea, string reflection, bool hasChecklistItems = false)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(tradeIdea) && string.IsNullOrWhiteSpace(reflection) && !hasChecklistItems)
            throw new ArgumentException("TradeIdea, Reflection, or Checklist is required.");

        return new DailyJournal(userId, journalDateUtc, tradeIdea, reflection);
    }

    public void Update(DateTime journalDateUtc, string tradeIdea, string reflection, bool hasChecklistItems = false)
    {
        if (string.IsNullOrWhiteSpace(tradeIdea) && string.IsNullOrWhiteSpace(reflection) && !hasChecklistItems)
            throw new ArgumentException("TradeIdea, Reflection, or Checklist is required.");

        JournalDateUtc = journalDateUtc.Date;
        TradeIdea = tradeIdea.Trim();
        Reflection = reflection.Trim();
        Note = BuildLegacyNote(TradeIdea, Reflection);
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void ReplaceChecklistItems(IReadOnlyCollection<DailyJournalChecklistItem> checklistItems)
    {
        ChecklistItems.Clear();
        foreach (var checklistItem in checklistItems.OrderBy(i => i.Sequence))
        {
            ChecklistItems.Add(checklistItem);
        }

        UpdatedAtUtc = DateTime.UtcNow;
    }

    private static string BuildLegacyNote(string tradeIdea, string reflection)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(tradeIdea))
        {
            parts.Add(tradeIdea.Trim());
        }

        if (!string.IsNullOrWhiteSpace(reflection))
        {
            parts.Add(reflection.Trim());
        }

        return string.Join("\n\n", parts);
    }
}
