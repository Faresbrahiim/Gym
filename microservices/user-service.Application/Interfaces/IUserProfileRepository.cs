using user_service.Application.Entities;

namespace user_service.Application.Interfaces
{
    public interface IUserProfileRepository
    {
        Task<UserProfile?> GetByUserId(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task Create(
            UserProfile profile,
            CancellationToken cancellationToken = default);

        Task Update(
            UserProfile profile,
            CancellationToken cancellationToken = default);
    }
}