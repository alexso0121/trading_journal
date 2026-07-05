using FluentValidation;

namespace trading_journel_app.Application.Trades;

public sealed class GetTradesValidator : AbstractValidator<GetTradesRequest>
{
    public GetTradesValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100);

        RuleFor(x => x.StrategyId)
            .Must(strategyId => strategyId is null || strategyId != Guid.Empty)
            .WithMessage("StrategyId must be a non-empty GUID.");
    }
}
