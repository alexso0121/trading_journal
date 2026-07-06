using FluentValidation;

namespace trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;

public sealed class CreateDailyJournalValidator : AbstractValidator<CreateDailyJournalRequest>
{
    public CreateDailyJournalValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.TradeIdea) || !string.IsNullOrWhiteSpace(x.Reflection))
            .WithMessage("TradeIdea or Reflection is required.");

        RuleFor(x => x.TradeIdea).MaximumLength(4000);
        RuleFor(x => x.Reflection).MaximumLength(4000);
    }
}
