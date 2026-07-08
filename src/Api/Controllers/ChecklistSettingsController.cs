using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Features.ChecklistSettings;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class ChecklistSettingsController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetChecklistItems(
        [FromServices] GetChecklistConfigItemsUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var items = await useCase.ExecuteAsync(userId, cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> CreateChecklistItem(
        [FromBody] CreateChecklistConfigItemRequest request,
        [FromServices] CreateChecklistConfigItemUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var created = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return Ok(created);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteChecklistItem(
        Guid id,
        [FromServices] DeleteChecklistConfigItemUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var deleted = await useCase.ExecuteAsync(userId, id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> ReorderChecklistItems(
        [FromBody] ReorderChecklistConfigItemsRequest request,
        [FromServices] ReorderChecklistConfigItemsUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var updated = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return updated ? NoContent() : BadRequest("Invalid checklist ordering payload.");
    }
}