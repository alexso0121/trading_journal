using FluentValidation;

namespace trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;

public sealed class CreateDailyJournalValidator : AbstractValidator<CreateDailyJournalRequest>
{
    public CreateDailyJournalValidator()
    {
        RuleFor(x => x.Note).NotEmpty().MaximumLength(2000);
    }
}
