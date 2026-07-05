using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Persistence.Interceptors;
using trading_journel_app.Infrastructure.Repositories;

namespace trading_journel_app.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("TradingJournalDb");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Connection string 'TradingJournalDb' is missing.");
        }

        services.AddSingleton<AuditLogInterceptor>();
        services.AddDbContext<TradingJournalDbContext>((provider, options) =>
            options.UseNpgsql(connectionString)
                .AddInterceptors(provider.GetRequiredService<AuditLogInterceptor>()));
        services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<TradingJournalDbContext>());
        services.AddScoped<IDailyJournalRepository, DailyJournalRepository>();
        services.AddScoped<IStrategyRepository, StrategyRepository>();
        services.AddScoped<ITradeRepository, TradeRepository>();

        return services;
    }
}
