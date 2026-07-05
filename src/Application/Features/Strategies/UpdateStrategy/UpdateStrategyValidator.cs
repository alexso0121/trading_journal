using FluentValidation;

namespace trading_journel_app.Application.Strategies.UpdateStrategy;

public sealed class UpdateStrategyValidator : AbstractValidator<UpdateStrategyRequest>
{
    public UpdateStrategyValidator()
    {
        RuleFor(x => x.LastKnownVersion).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
    }
}
