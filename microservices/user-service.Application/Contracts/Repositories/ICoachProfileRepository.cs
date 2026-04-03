using user_service.Application.Domain.Entities;

namespace user_service.Application.Contracts.Repositories
{
    public interface ICoachProfileRepository
    {
        Task<CoachProfile?> GetByUserId(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task Create(
            CoachProfile profile,
            CancellationToken cancellationToken = default);

        Task Update(
            CoachProfile profile,
            CancellationToken cancellationToken = default);
    }
}
