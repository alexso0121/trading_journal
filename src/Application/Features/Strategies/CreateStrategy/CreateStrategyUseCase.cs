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

        var requestedTags = request.Tags
            .Select(name => name.Trim())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .DistinctBy(Domain.Entities.StrategyTag.Normalize)
            .ToList();

        if (requestedTags.Count > 0)
        {
            var normalizedNames = requestedTags.Select(Domain.Entities.StrategyTag.Normalize).ToList();
            var existingTags = await strategyRepository.GetTagsByNormalizedNamesAsync(userId, normalizedNames, cancellationToken);
            var resolvedTags = existingTags.ToDictionary(t => t.NormalizedName, t => t);

            foreach (var tagName in requestedTags)
            {
                var normalized = Domain.Entities.StrategyTag.Normalize(tagName);
                if (!resolvedTags.TryGetValue(normalized, out var tag))
                {
                    tag = Domain.Entities.StrategyTag.Create(userId, tagName);
                    await strategyRepository.AddTagAsync(tag, cancellationToken);
                    resolvedTags[normalized] = tag;
                }
            }

            strategy.ReplaceTags(resolvedTags.Values.ToList());
        }

        await strategyRepository.AddAsync(strategy, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return StrategyResponse.FromEntity(strategy);
    }
}
