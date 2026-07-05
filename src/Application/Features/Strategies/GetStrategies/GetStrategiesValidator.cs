using FluentValidation;

namespace trading_journel_app.Application.Strategies;

public sealed class GetStrategiesValidator : AbstractValidator<GetStrategiesRequest>
{
    public GetStrategiesValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100);
    }
}
