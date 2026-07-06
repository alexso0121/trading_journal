using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Infrastructure.Persistence;
using trading_journel_app.Infrastructure.Persistence.Interceptors;
using trading_journel_app.Infrastructure.Repositories;
using trading_journel_app.Application.Common.Storage;
using trading_journel_app.Infrastructure.Storage;
using Amazon.S3;
using Amazon.Runtime;
using Amazon.Extensions.NETCore.Setup;

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
        services.Configure<S3ScreenshotStorageOptions>(configuration.GetSection(S3ScreenshotStorageOptions.SectionName));
        services.AddSingleton<IAmazonS3>(provider =>
        {
            var storageOptions = provider.GetRequiredService<IOptions<S3ScreenshotStorageOptions>>().Value;

            if (!string.IsNullOrWhiteSpace(storageOptions.ServiceUrl))
            {
                if (string.IsNullOrWhiteSpace(storageOptions.AccessKeyId) ||
                    string.IsNullOrWhiteSpace(storageOptions.SecretAccessKey))
                {
                    throw new InvalidOperationException(
                        "Storage:S3:AccessKeyId and Storage:S3:SecretAccessKey are required when Storage:S3:ServiceUrl is configured.");
                }

                var r2Config = new AmazonS3Config
                {
                    ServiceURL = storageOptions.ServiceUrl,
                    ForcePathStyle = storageOptions.ForcePathStyle,
                    AuthenticationRegion = string.IsNullOrWhiteSpace(storageOptions.AuthenticationRegion)
                        ? "auto"
                        : storageOptions.AuthenticationRegion,
                };

                var credentials = new BasicAWSCredentials(storageOptions.AccessKeyId, storageOptions.SecretAccessKey);
                return new AmazonS3Client(credentials, r2Config);
            }

            var awsOptions = configuration.GetAWSOptions();
            return awsOptions.CreateServiceClient<IAmazonS3>();
        });
        services.AddScoped<IJournalScreenshotStorage, StubJournalScreenshotStorage>();
        services.AddScoped<IStrategyContentImageStorage, S3StrategyContentImageStorage>();

        return services;
    }
}
