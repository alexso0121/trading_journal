using FluentValidation;

namespace trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

public sealed class UpdateDailyJournalValidator : AbstractValidator<UpdateDailyJournalRequest>
{
    public UpdateDailyJournalValidator()
    {
        RuleFor(x => x)
            .Must(x =>
                !string.IsNullOrWhiteSpace(x.TradeIdea) ||
                !string.IsNullOrWhiteSpace(x.Reflection) ||
                x.ChecklistItems.Count > 0)
            .WithMessage("TradeIdea, Reflection, or Checklist is required.");

        RuleFor(x => x.TradeIdea).MaximumLength(4000);
        RuleFor(x => x.Reflection).MaximumLength(4000);

        RuleForEach(x => x.ChecklistItems)
            .ChildRules(item =>
            {
                item.RuleFor(i => i.Label).NotEmpty().MaximumLength(200);
                item.RuleFor(i => i.Sequence).GreaterThan(0);
            });
    }
}
