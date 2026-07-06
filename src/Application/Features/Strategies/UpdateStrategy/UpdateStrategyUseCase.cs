using Microsoft.EntityFrameworkCore;
using trading_journel_app.Application.Repositories;
using trading_journel_app.Application.Strategies;
using trading_journel_app.Application.Strategies.UpdateStrategy;

namespace trading_journel_app.Application.Features.Strategies.UpdateStrategy;

public sealed record UpdateStrategyResult(bool NotFound, bool ConcurrencyConflict, StrategyResponse? Strategy);

public sealed class UpdateStrategyUseCase(IStrategyRepository strategyRepository, IUnitOfWork unitOfWork)
{
    public async Task<UpdateStrategyResult> ExecuteAsync(
        Guid strategyId,
        UpdateStrategyRequest request,
        CancellationToken cancellationToken)
    {
        var strategy = await strategyRepository.GetByIdAsync(strategyId, cancellationToken);
        if (strategy is null)
        {
            return new UpdateStrategyResult(true, false, null);
        }

        if (strategy.Version != request.LastKnownVersion)
        {
            return new UpdateStrategyResult(false, true, null);
        }

        var nameChanged = !string.Equals(strategy.Name, request.Name, StringComparison.Ordinal);
        var isDuplicatedStrategy = nameChanged &&
                                   await strategyRepository.ExistsByNameAndUserId(request.Name, strategy.UserId,
                                       cancellationToken);

        if (isDuplicatedStrategy)
        {
            throw new InvalidOperationException($"Strategy with name '{request.Name}' already exists for the user.");
        }

        strategy.Update(request.Name, request.Description);

        var requestedTags = request.Tags
            .Select(name => name.Trim())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .DistinctBy(Domain.Entities.StrategyTag.Normalize)
            .ToList();

        if (requestedTags.Count == 0)
        {
            strategy.ReplaceTags([]);
        }
        else
        {
            var normalizedNames = requestedTags.Select(Domain.Entities.StrategyTag.Normalize).ToList();
            var existingTags = await strategyRepository.GetTagsByNormalizedNamesAsync(strategy.UserId, normalizedNames,
                cancellationToken);
            var resolvedTags = existingTags.ToDictionary(t => t.NormalizedName, t => t);

            foreach (var tagName in requestedTags)
            {
                var normalized = Domain.Entities.StrategyTag.Normalize(tagName);
                if (!resolvedTags.TryGetValue(normalized, out var tag))
                {
                    tag = Domain.Entities.StrategyTag.Create(strategy.UserId, tagName);
                    await strategyRepository.AddTagAsync(tag, cancellationToken);
                    resolvedTags[normalized] = tag;
                }
            }

            strategy.ReplaceTags(resolvedTags.Values.ToList());
        }

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new UpdateStrategyResult(false, false, StrategyResponse.FromEntity(strategy));
        }
        catch (DbUpdateConcurrencyException)
        {
            return new UpdateStrategyResult(false, true, null);
        }
    }
}
