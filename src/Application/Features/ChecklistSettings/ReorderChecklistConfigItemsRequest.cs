namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class ReorderChecklistConfigItemsRequest
{
    public IReadOnlyCollection<Guid> ItemIds { get; init; } = [];
}