using FluentValidation;
using trading_journel_app.Application.Features.ChecklistSettings;
using trading_journel_app.Application.Features.DailyJournals;
using trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;
using trading_journel_app.Application.Features.DailyJournals.Files;
using trading_journel_app.Application.Features.DailyJournals.Screenshots;
using trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;
using trading_journel_app.Application.Features.StoredFiles;
using trading_journel_app.Application.Features.Strategies;
using trading_journel_app.Application.Features.Strategies.CreateStrategy;
using trading_journel_app.Application.Features.Strategies.Files;
using trading_journel_app.Application.Features.Strategies.Images;
using trading_journel_app.Application.Features.Strategies.UpdateStrategy;
using trading_journel_app.Application.Strategies;
using trading_journel_app.Application.Strategies.CreateStrategy;
using trading_journel_app.Application.Strategies.UpdateStrategy;
using trading_journel_app.Application.Trades;
using trading_journel_app.Application.Trades.CreateTrade;
using trading_journel_app.Application.Trades.UpdateTrade;

namespace trading_journel_app.Application.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<GetChecklistConfigItemsUseCase>();
        services.AddScoped<CreateChecklistConfigItemUseCase>();
        services.AddScoped<DeleteChecklistConfigItemUseCase>();
        services.AddScoped<ReorderChecklistConfigItemsUseCase>();
        services.AddScoped<CreateTradeUseCase>();
        services.AddScoped<GetTradesUseCase>();
        services.AddScoped<GetTradeByIdUseCase>();
        services.AddScoped<UpdateTradeUseCase>();
        services.AddScoped<DeleteTradeUseCase>();
        services.AddScoped<CreateDailyJournalUseCase>();
        services.AddScoped<CreateStoredFileTempUploadUrlUseCase>();
        services.AddScoped<CreateDailyJournalScreenshotUploadUrlUseCase>();
        services.AddScoped<CreateDailyJournalTempScreenshotUploadUrlUseCase>();
        services.AddScoped<FinalizeDailyJournalFilesUseCase>();
        services.AddScoped<FinalizeDailyJournalScreenshotsUseCase>();
        services.AddScoped<GetDailyJournalsUseCase>();
        services.AddScoped<GetDailyJournalDetailUseCase>();
        services.AddScoped<GetDailyJournalByIdUseCase>();
        services.AddScoped<UpdateDailyJournalUseCase>();
        services.AddScoped<DeleteDailyJournalUseCase>();
        services.AddScoped<ResolveStoredFilesUseCase>();
        services.AddScoped<CreateStrategyUseCase>();
        services.AddScoped<CreateStrategyContentImageUploadUrlUseCase>();
        services.AddScoped<FinalizeStrategyFilesUseCase>();
        services.AddScoped<GetStrategiesUseCase>();
        services.AddScoped<GetStrategyByIdUseCase>();
        services.AddScoped<UpdateStrategyUseCase>();
        services.AddScoped<DeleteStrategyUseCase>();
        services.AddValidatorsFromAssemblyContaining<CreateTradeValidator>();
        return services;
    }
}
