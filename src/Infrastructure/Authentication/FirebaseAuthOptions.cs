namespace trading_journel_app.Infrastructure.Authentication;

public sealed class FirebaseAuthOptions
{
    public const string SectionName = "Firebase";

    public string? ProjectId { get; init; }
    public string? CredentialsPath { get; init; }
}
