using user_service.Application.Entities;
using user_service.Application.Enums;

namespace user_service.Application.Interfaces
{
    public interface IUserTokenRepository
    {
        Task Create(UserToken token, CancellationToken cancellationToken = default);

        Task<UserToken?> GetValidToken(
            string tokenHash,
            UserTokenType type,
            CancellationToken cancellationToken = default);

        Task Update(UserToken token, CancellationToken cancellationToken = default);
    }
}