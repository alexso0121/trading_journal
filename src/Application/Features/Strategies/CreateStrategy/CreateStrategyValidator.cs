using FluentValidation;

namespace trading_journel_app.Application.Strategies.CreateStrategy;

public sealed class CreateStrategyValidator : AbstractValidator<CreateStrategyRequest>
{
    public CreateStrategyValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
    }
}
