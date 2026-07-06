using FluentValidation;

namespace trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

public sealed class UpdateDailyJournalValidator : AbstractValidator<UpdateDailyJournalRequest>
{
    public UpdateDailyJournalValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.TradeIdea) || !string.IsNullOrWhiteSpace(x.Reflection))
            .WithMessage("TradeIdea or Reflection is required.");

        RuleFor(x => x.TradeIdea).MaximumLength(4000);
        RuleFor(x => x.Reflection).MaximumLength(4000);
    }
}
