using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Features.DailyJournals;
using trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;
using trading_journel_app.Application.Features.DailyJournals.Screenshots;
using trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class DailyJournalsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateDailyJournal(
        [FromBody] CreateDailyJournalRequest request,
        [FromServices] CreateDailyJournalUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var createdJournal = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetDailyJournalById), new { id = createdJournal.Id }, createdJournal);
    }

    [HttpGet]
    public async Task<IActionResult> GetDailyJournals(
        [FromServices] GetDailyJournalsUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var journals = await useCase.ExecuteAsync(userId, cancellationToken);
        return Ok(journals);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDailyJournalById(
        Guid id,
        [FromServices] GetDailyJournalByIdUseCase useCase,
        CancellationToken cancellationToken)
    {
        var journal = await useCase.ExecuteAsync(id, cancellationToken);
        return journal is null ? NotFound() : Ok(journal);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateDailyJournal(
        Guid id,
        [FromBody] UpdateDailyJournalRequest request,
        [FromServices] UpdateDailyJournalUseCase useCase,
        CancellationToken cancellationToken)
    {
        var journal = await useCase.ExecuteAsync(id, request, cancellationToken);
        return journal is null ? NotFound() : Ok(journal);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteDailyJournal(
        Guid id,
        [FromServices] DeleteDailyJournalUseCase useCase,
        CancellationToken cancellationToken)
    {
        var deleted = await useCase.ExecuteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/screenshot/upload-url")]
    public async Task<IActionResult> CreateScreenshotUploadUrl(
        Guid id,
        [FromBody] CreateDailyJournalScreenshotUploadUrlRequest request,
        [FromServices] CreateDailyJournalScreenshotUploadUrlUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var response = await useCase.ExecuteAsync(userId, id, request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("screenshot/temp-upload-url")]
    public async Task<IActionResult> CreateTempScreenshotUploadUrl(
        [FromBody] CreateDailyJournalTempScreenshotUploadUrlRequest request,
        [FromServices] CreateDailyJournalTempScreenshotUploadUrlUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var response = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{id:guid}/screenshot/finalize")]
    public async Task<IActionResult> FinalizeScreenshots(
        Guid id,
        [FromBody] FinalizeDailyJournalScreenshotsRequest request,
        [FromServices] FinalizeDailyJournalScreenshotsUseCase useCase,
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
