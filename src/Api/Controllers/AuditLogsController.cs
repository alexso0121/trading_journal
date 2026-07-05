using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class AuditLogsController(TradingJournalDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int take = 200, CancellationToken cancellationToken = default)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var safeTake = Math.Clamp(take, 1, 1000);

        var logs = await dbContext.AuditLogs
            .AsNoTracking()
            .Where(log => log.UserId == userId)
            .OrderByDescending(log => log.OccurredAtUtc)
            .Take(safeTake)
            .Select(log => new AuditLogResponse(
                log.Id,
                log.EntityId,
                log.EntityType,
                log.EventType,
                log.UserId,
                log.Version,
                log.PayloadJson,
                log.OccurredAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(logs);
    }
}

public sealed record AuditLogResponse(
    Guid Id,
    Guid EntityId,
    string EntityType,
    string EventType,
    Guid UserId,
    int? Version,
    string PayloadJson,
    DateTime OccurredAtUtc);
