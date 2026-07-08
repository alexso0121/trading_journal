using FluentValidation;

namespace trading_journel_app.Application.Features.ChecklistSettings;

public sealed class CreateChecklistConfigItemValidator : AbstractValidator<CreateChecklistConfigItemRequest>
{
    public CreateChecklistConfigItemValidator()
    {
        RuleFor(x => x.Label)
            .NotEmpty()
            .MaximumLength(200);
    }
}