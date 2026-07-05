using Xunit;

namespace trading_journel_app.tests.Fixtures;

using Testcontainers.PostgreSql;

public sealed class PostgreSqlFixture : IAsyncLifetime
{
    private PostgreSqlContainer Container { get; }

    public PostgreSqlFixture()
    {
        // Keep compatibility with older Docker Engine API exposed by local Docker Desktop.
        Environment.SetEnvironmentVariable("DOCKER_API_VERSION", "1.41");

        Container = new PostgreSqlBuilder("postgres:16")
            .WithDatabase("testdb")
            .WithUsername("postgres")
            .WithPassword("password")
            .Build();
    }

    public async Task InitializeAsync()
    {
        await Container.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await Container.DisposeAsync();
    }

    //get collection string
    // ✅ Add this method
    public string GetConnectionString()
    {
        return Container.GetConnectionString();
    }

}
