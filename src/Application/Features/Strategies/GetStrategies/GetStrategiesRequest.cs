namespace trading_journel_app.Application.Strategies;

public sealed record GetStrategiesRequest(
    int PageNumber = 1,
    int PageSize = 20);
