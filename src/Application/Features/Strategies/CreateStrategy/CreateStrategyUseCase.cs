using trading_journel_app.Application.Repositories;
using trading_journel_app.Application.Strategies;
using trading_journel_app.Application.Strategies.CreateStrategy;
using trading_journel_app.Domain.Entities;

namespace trading_journel_app.Application.Features.Strategies.CreateStrategy;

public sealed class CreateStrategyUseCase(IStrategyRepository strategyRepository, IUnitOfWork unitOfWork)
{
    public async Task<StrategyResponse> ExecuteAsync(CreateStrategyRequest request, Guid userId, CancellationToken cancellationToken)
    {
        var isStrategyExist = await strategyRepository.ExistsByNameAndUserId(request.Name, userId, cancellationToken);

        if (isStrategyExist)
        {
            throw new InvalidOperationException($"Strategy with name '{request.Name}' already exists for the user.");
        }

        var strategy = Strategy.Create(userId, request.Name, request.Description);
        await strategyRepository.AddAsync(strategy, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return StrategyResponse.FromEntity(strategy);
    }
}
