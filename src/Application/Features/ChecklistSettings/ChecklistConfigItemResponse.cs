using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed record ChecklistConfigItemResponse(
    Guid Id,
    Guid UserId,
    string Label,
    int Sequence,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc)
{
    public static ChecklistConfigItemResponse FromEntity(ChecklistConfigItem entity) =>
        new(
            entity.Id,
            entity.UserId,
            entity.Label,
            entity.Sequence,
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc);
}