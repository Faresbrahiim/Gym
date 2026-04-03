using user_service.Application.Domain.Entities;

namespace user_service.Application.Contracts.Repositories
{
    public interface IMemberProfileRepository
    {
        Task<MemberProfile?> GetByUserId(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task Create(
            MemberProfile profile,
            CancellationToken cancellationToken = default);

        Task Update(
            MemberProfile profile,
            CancellationToken cancellationToken = default);
    }
}
