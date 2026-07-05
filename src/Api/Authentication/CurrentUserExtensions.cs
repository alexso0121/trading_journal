using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace trading_journel_app.Api.Authentication;

public static class CurrentUserExtensions
{
    public static bool TryGetCurrentUserId(this ClaimsPrincipal user, out Guid userId)
    {
        var candidates = new[]
        {
            user.FindFirstValue("app_user_id"),
            user.FindFirstValue(ClaimTypes.NameIdentifier),
            user.FindFirstValue("user_id"),
            user.FindFirstValue("sub")
        };

        foreach (var candidate in candidates)
        {
            if (Guid.TryParse(candidate, out userId))
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(candidate))
            {
                userId = CreateStableGuid(candidate);
                return true;
            }
        }

        userId = Guid.Empty;
        return false;
    }

    private static Guid CreateStableGuid(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        Span<byte> guidBytes = stackalloc byte[16];
        bytes[..16].CopyTo(guidBytes);
        guidBytes[7] = (byte)((guidBytes[7] & 0x0F) | 0x40);
        guidBytes[8] = (byte)((guidBytes[8] & 0x3F) | 0x80);
        return new Guid(guidBytes);
    }
}
