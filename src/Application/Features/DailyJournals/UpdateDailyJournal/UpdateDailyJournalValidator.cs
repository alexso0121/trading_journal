using FluentValidation;

namespace trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;

public sealed class UpdateDailyJournalValidator : AbstractValidator<UpdateDailyJournalRequest>
{
    public UpdateDailyJournalValidator()
    {
        RuleFor(x => x.Note).NotEmpty().MaximumLength(2000);
    }
}
