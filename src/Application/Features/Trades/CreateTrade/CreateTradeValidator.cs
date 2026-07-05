using FluentValidation;

namespace trading_journel_app.Application.Trades.CreateTrade;

public sealed class CreateTradeValidator : AbstractValidator<CreateTradeRequest>
{
    public CreateTradeValidator()
    {
        RuleFor(x => x.StrategyId).NotEmpty();
        RuleFor(x => x.Ticker).NotEmpty();
        RuleFor(x => x.Market).NotEmpty();
        RuleFor(x => x.EntryPrice).GreaterThan(0);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.OpenTimeUtc).LessThanOrEqualTo(DateTime.UtcNow);
    }
}