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

    public static DailyJournal Create(Guid userId, DateTime journalDateUtc, string tradeIdea, string reflection)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(tradeIdea) && string.IsNullOrWhiteSpace(reflection))
            throw new ArgumentException("TradeIdea or Reflection is required.");

        return new DailyJournal(userId, journalDateUtc, tradeIdea, reflection);
    }

    public void Update(DateTime journalDateUtc, string tradeIdea, string reflection)
    {
        if (string.IsNullOrWhiteSpace(tradeIdea) && string.IsNullOrWhiteSpace(reflection))
            throw new ArgumentException("TradeIdea or Reflection is required.");

        JournalDateUtc = journalDateUtc.Date;
        TradeIdea = tradeIdea.Trim();
        Reflection = reflection.Trim();
        Note = BuildLegacyNote(TradeIdea, Reflection);
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
