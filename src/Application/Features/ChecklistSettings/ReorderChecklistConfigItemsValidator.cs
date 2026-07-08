using FluentValidation;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class ReorderChecklistConfigItemsValidator : AbstractValidator<ReorderChecklistConfigItemsRequest>
{
    public ReorderChecklistConfigItemsValidator()
    {
        RuleFor(x => x.ItemIds)
            .NotNull();
    }
}