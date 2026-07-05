using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Trades;
using trading_journel_app.Application.Trades.CreateTrade;
using trading_journel_app.Application.Trades.UpdateTrade;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class TradesController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateTrade(
        [FromBody] CreateTradeRequest request,
        [FromServices] CreateTradeUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var createdTrade = await useCase.ExecuteAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetTradeById), new { id = createdTrade.Id }, createdTrade);
    }

    [HttpGet]
    public async Task<IActionResult> GetTrades(
        [FromQuery] GetTradesRequest request,
        [FromServices] GetTradesUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var trades = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return Ok(trades);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTradeById(
        Guid id,
        [FromServices] GetTradeByIdUseCase useCase,
        CancellationToken cancellationToken)
    {
        var trade = await useCase.ExecuteAsync(id, cancellationToken);
        return trade is null ? NotFound() : Ok(trade);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrade(
        Guid id,
        [FromBody] UpdateTradeRequest request,
        [FromServices] UpdateTradeUseCase useCase,
        CancellationToken cancellationToken)
    {
        var result = await useCase.ExecuteAsync(id, request, cancellationToken);
        if (result.NotFound)
        {
            return NotFound();
        }

        if (result.ConcurrencyConflict)
        {
            return Conflict("Trade was modified by another request. Refresh and retry with the latest value.");
        }

        return Ok(result.Trade);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTrade(
        Guid id,
        [FromQuery] int lastKnownVersion,
        [FromServices] DeleteTradeUseCase useCase,
        CancellationToken cancellationToken)
    {
        var result = await useCase.ExecuteAsync(id, lastKnownVersion, cancellationToken);
        if (result.NotFound)
        {
            return NotFound();
        }

        if (result.ConcurrencyConflict)
        {
            return Conflict("Trade was modified by another request. Refresh and retry with the latest value.");
        }

        return NoContent();
    }
}
