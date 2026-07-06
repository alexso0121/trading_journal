using FluentValidation;
using trading_journel_app.Application.Features.DailyJournals;
using trading_journel_app.Application.Features.DailyJournals.CreateDailyJournal;
using trading_journel_app.Application.Features.DailyJournals.Screenshots;
using trading_journel_app.Application.Features.DailyJournals.UpdateDailyJournal;
using trading_journel_app.Application.Features.Strategies;
using trading_journel_app.Application.Features.Strategies.CreateStrategy;
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
        services.AddScoped<CreateTradeUseCase>();
        services.AddScoped<GetTradesUseCase>();
        services.AddScoped<GetTradeByIdUseCase>();
        services.AddScoped<UpdateTradeUseCase>();
        services.AddScoped<DeleteTradeUseCase>();
        services.AddScoped<CreateDailyJournalUseCase>();
        services.AddScoped<CreateDailyJournalScreenshotUploadUrlUseCase>();
        services.AddScoped<GetDailyJournalsUseCase>();
        services.AddScoped<GetDailyJournalByIdUseCase>();
        services.AddScoped<UpdateDailyJournalUseCase>();
        services.AddScoped<DeleteDailyJournalUseCase>();
        services.AddScoped<CreateStrategyUseCase>();
        services.AddScoped<CreateStrategyContentImageUploadUrlUseCase>();
        services.AddScoped<GetStrategiesUseCase>();
        services.AddScoped<GetStrategyByIdUseCase>();
        services.AddScoped<UpdateStrategyUseCase>();
        services.AddScoped<DeleteStrategyUseCase>();
        services.AddValidatorsFromAssemblyContaining<CreateTradeValidator>();
        return services;
    }
}
