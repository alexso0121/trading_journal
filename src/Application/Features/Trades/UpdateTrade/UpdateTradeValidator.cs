using FluentValidation;
using trading_journel_app.Domain.Enums;

namespace trading_journel_app.Application.Trades.UpdateTrade;

public sealed class UpdateTradeValidator : AbstractValidator<UpdateTradeRequest>
{
    public UpdateTradeValidator()
    {
        RuleFor(x => x.StrategyId).NotEmpty();
        RuleFor(x => x.Ticker).NotEmpty();
        RuleFor(x => x.Market).NotEmpty();
        RuleFor(x => x.Asset).IsInEnum();
        RuleFor(x => x.EntryPrice).GreaterThan(0);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.Comments).MaximumLength(4000);
        RuleFor(x => x.LastKnownVersion).GreaterThan(0);
        RuleFor(x => x.OpenTimeUtc).LessThanOrEqualTo(DateTime.UtcNow);
        RuleFor(x => x)
            .Must(x => !x.CloseTimeUtc.HasValue || x.CloseTimeUtc.Value >= x.OpenTimeUtc)
            .WithMessage("CloseTimeUtc cannot be earlier than OpenTimeUtc.");
        RuleFor(x => x)
            .Must(x => x.Status != TradeStatus.Closed || x.CloseTimeUtc.HasValue)
            .WithMessage("CloseTimeUtc is required when status is Closed.");
    }
}
