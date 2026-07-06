using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Common;
using trading_journel_app.Infrastructure.Persistence;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class AuditLogsController(TradingJournalDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var safePageNumber = Math.Max(1, pageNumber);
        var safePageSize = Math.Clamp(pageSize, 1, 200);

        var query = dbContext.AuditLogs
            .AsNoTracking()
            .Where(log => log.UserId == userId)
            .OrderByDescending(log => log.OccurredAtUtc);

        var totalCount = await query.CountAsync(cancellationToken);

        var logs = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
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

        return Ok(new PagedResponse<AuditLogResponse>(
            logs,
            safePageNumber,
            safePageSize,
            totalCount));
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
