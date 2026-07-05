using System.Security.Claims;
using System.Text.Encodings.Web;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace trading_journel_app.Infrastructure.Authentication;

public sealed class FirebaseAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    FirebaseAuth firebaseAuth,
    IConfiguration configuration)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
        {
            return AuthenticateResult.NoResult();
        }

        var header = authorizationHeader.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.NoResult();
        }

        var token = header["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return AuthenticateResult.Fail("Missing bearer token.");
        }

        try
        {
            var decodedToken = await firebaseAuth.VerifyIdTokenAsync(token);
            var projectId = configuration[$"{FirebaseAuthOptions.SectionName}:ProjectId"];
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                var expectedIssuer = $"https://securetoken.google.com/{projectId}";
                if (!string.Equals(decodedToken.Issuer, expectedIssuer, StringComparison.Ordinal))
                {
                    return AuthenticateResult.Fail("Token issuer mismatch.");
                }

                if (!string.Equals(decodedToken.Audience, projectId, StringComparison.Ordinal))
                {
                    return AuthenticateResult.Fail("Token audience mismatch.");
                }
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, decodedToken.Uid),
                new(ClaimTypes.Name, decodedToken.Uid)
            };

            foreach (var claim in decodedToken.Claims)
            {
                if (claim.Value is null)
                {
                    continue;
                }

                claims.Add(new Claim(claim.Key, claim.Value.ToString() ?? string.Empty));
            }

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return AuthenticateResult.Success(ticket);
        }
        catch (FirebaseAuthException ex)
        {
            return AuthenticateResult.Fail($"Firebase token validation failed: {ex.Message}");
        }
    }
}
