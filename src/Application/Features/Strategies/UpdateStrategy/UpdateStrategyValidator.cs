using FluentValidation;

namespace trading_journel_app.Application.Strategies.UpdateStrategy;

public sealed class UpdateStrategyValidator : AbstractValidator<UpdateStrategyRequest>
{
    public UpdateStrategyValidator()
    {
        RuleFor(x => x.LastKnownVersion).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.Tags).Must(tags => tags.Count <= 20).WithMessage("A strategy can have up to 20 tags.");
        RuleForEach(x => x.Tags).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Tags)
            .Must(tags => tags.Select(Domain.Entities.StrategyTag.Normalize).Distinct().Count() == tags.Count)
            .WithMessage("Duplicate tags are not allowed.");
    }
}
