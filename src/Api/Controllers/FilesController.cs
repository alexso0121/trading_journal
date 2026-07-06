using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using trading_journel_app.Api.Authentication;
using trading_journel_app.Application.Features.StoredFiles;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class FilesController : ControllerBase
{
    [HttpPost("journal-content/temp-upload-url")]
    public async Task<IActionResult> CreateJournalContentTempUploadUrl(
        [FromBody] CreateStoredFileTempUploadUrlRequest request,
        [FromServices] CreateStoredFileTempUploadUrlUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var response = await useCase.ExecuteAsync(
            userId,
            StoredFileOwnerType.DailyJournal,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("strategy-content/temp-upload-url")]
    public async Task<IActionResult> CreateStrategyContentTempUploadUrl(
        [FromBody] CreateStoredFileTempUploadUrlRequest request,
        [FromServices] CreateStoredFileTempUploadUrlUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var response = await useCase.ExecuteAsync(
            userId,
            StoredFileOwnerType.Strategy,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("resolve")]
    public async Task<IActionResult> ResolveFiles(
        [FromBody] ResolveStoredFilesRequest request,
        [FromServices] ResolveStoredFilesUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized("Firebase token must include a GUID user id claim.");
        }

        var response = await useCase.ExecuteAsync(userId, request, cancellationToken);
        return Ok(response);
    }
}
