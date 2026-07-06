using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Features.Strategies;
using trading_journel_app.Application.Features.Strategies.CreateStrategy;
using trading_journel_app.Application.Features.Strategies.Images;
using trading_journel_app.Application.Features.Strategies.UpdateStrategy;
using trading_journel_app.Application.Strategies;
using trading_journel_app.Application.Strategies.CreateStrategy;
using trading_journel_app.Application.Strategies.UpdateStrategy;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class StrategiesController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateStrategy(
        [FromBody] CreateStrategyRequest request,
        [FromServices] CreateStrategyUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var createdStrategy = await useCase.ExecuteAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetStrategyById), new { id = createdStrategy.Id }, createdStrategy);
    }

    [HttpGet]
    public async Task<IActionResult> GetStrategies(
        [FromQuery] GetStrategiesRequest request,
        [FromServices] GetStrategiesUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var strategies = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return Ok(strategies);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStrategyById(
        Guid id,
        [FromServices] GetStrategyByIdUseCase useCase,
        CancellationToken cancellationToken)
    {
        var strategy = await useCase.ExecuteAsync(id, cancellationToken);
        return strategy is null ? NotFound() : Ok(strategy);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStrategy(
        Guid id,
        [FromBody] UpdateStrategyRequest request,
        [FromServices] UpdateStrategyUseCase useCase,
        CancellationToken cancellationToken)
    {
        var result = await useCase.ExecuteAsync(id, request, cancellationToken);
        if (result.NotFound)
        {
            return NotFound();
        }

        if (result.ConcurrencyConflict)
        {
            return Conflict("Strategy was modified by another request. Refresh and retry with the latest value.");
        }

        return Ok(result.Strategy);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStrategy(
        Guid id,
        [FromQuery] int lastKnownVersion,
        [FromServices] DeleteStrategyUseCase useCase,
        CancellationToken cancellationToken)
    {
        var result = await useCase.ExecuteAsync(id, lastKnownVersion, cancellationToken);
        if (result.NotFound)
        {
            return NotFound();
        }

        if (result.ConcurrencyConflict)
        {
            return Conflict("Strategy was modified by another request. Refresh and retry with the latest value.");
        }

        if (result.HasTrades)
        {
            return Conflict("Strategy cannot be deleted while trades exist.");
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/content-image/upload-url")]
    public async Task<IActionResult> CreateContentImageUploadUrl(
        Guid id,
        [FromBody] CreateStrategyContentImageUploadUrlRequest request,
        [FromServices] CreateStrategyContentImageUploadUrlUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var response = await useCase.ExecuteAsync(userId, id, request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}
