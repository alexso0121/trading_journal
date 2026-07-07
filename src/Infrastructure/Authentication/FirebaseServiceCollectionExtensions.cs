using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication;
using System.Text;

namespace trading_journel_app.Infrastructure.Authentication;

public static class FirebaseServiceCollectionExtensions
{
    public static IServiceCollection AddFirebaseAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var firebaseOptions = configuration.GetSection(FirebaseAuthOptions.SectionName).Get<FirebaseAuthOptions>() ?? new FirebaseAuthOptions();

        services.AddSingleton(provider =>
        {
            if (FirebaseApp.DefaultInstance is not null)
            {
                return FirebaseApp.DefaultInstance;
            }

            var appOptions = new AppOptions();
            if (!string.IsNullOrWhiteSpace(firebaseOptions.CredentialsJsonBase64))
            {
                try
                {
                    var credentialJson = Encoding.UTF8.GetString(
                        Convert.FromBase64String(firebaseOptions.CredentialsJsonBase64));
                    appOptions.Credential = GoogleCredential.FromJson(credentialJson);
                }
                catch (FormatException ex)
                {
                    throw new InvalidOperationException(
                        "Firebase:CredentialsJsonBase64 is not valid base64.",
                        ex);
                }
            }
            else if (!string.IsNullOrWhiteSpace(firebaseOptions.CredentialsPath))
            {
                appOptions.Credential = GoogleCredential.FromFile(firebaseOptions.CredentialsPath);
            }
            else
            {
                appOptions.Credential = GoogleCredential.GetApplicationDefault();
            }

            if (!string.IsNullOrWhiteSpace(firebaseOptions.ProjectId))
            {
                appOptions.ProjectId = firebaseOptions.ProjectId;
            }

            return FirebaseApp.Create(appOptions);
        });

        services.AddSingleton(provider =>
        {
            var app = provider.GetRequiredService<FirebaseApp>();
            return FirebaseAuth.GetAuth(app);
        });

        services.AddAuthentication("Firebase")
            .AddScheme<AuthenticationSchemeOptions, FirebaseAuthenticationHandler>("Firebase", _ => { });
        services.AddAuthorization();

        return services;
    }
}
