namespace trading_journel_app.Domain.Entities;

public sealed class Strategy
{
    private Strategy()
    {
    }

    private Strategy(Guid userId, string name, string description)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Name = name.Trim();
        Description = description.Trim();
        Version = 1;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int Version { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public ICollection<Trade> Trades { get; } = new List<Trade>();
    public ICollection<StrategyTag> Tags { get; } = new List<StrategyTag>();

    public static Strategy Create(Guid userId, string name, string description)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));

        return new Strategy(userId, name, description);
    }

    public void Update(string name, string description)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));

        Name = name.Trim();
        Description = description.Trim();
        Version += 1;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void ReplaceTags(IReadOnlyCollection<StrategyTag> tags)
    {
        Tags.Clear();
        foreach (var tag in tags)
        {
            Tags.Add(tag);
        }

        UpdatedAtUtc = DateTime.UtcNow;
    }
}
