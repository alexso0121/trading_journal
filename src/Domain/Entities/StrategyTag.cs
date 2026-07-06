namespace trading_journel_app.Domain.Entities;

public sealed class StrategyTag
{
    private StrategyTag()
    {
    }

    private StrategyTag(Guid userId, string name)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Name = name.Trim();
        NormalizedName = Normalize(Name);
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }
    public ICollection<Strategy> Strategies { get; } = new List<Strategy>();

    public static StrategyTag Create(Guid userId, string name)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Tag name is required.", nameof(name));

        var trimmed = name.Trim();
        if (trimmed.Length > 40) throw new ArgumentOutOfRangeException(nameof(name), "Tag name must be at most 40 characters.");

        return new StrategyTag(userId, trimmed);
    }

    public static string Normalize(string name)
    {
        return string.Join(' ', name.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}