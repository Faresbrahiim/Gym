using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;

namespace user_service.Application.Contracts.Repositories
{
    public interface IUserTokenRepository
    {
        Task Create(UserToken token, CancellationToken cancellationToken = default);

        Task<UserToken?> GetValidToken(
            string tokenHash,
            UserTokenType type,
            CancellationToken cancellationToken = default);

        Task Update(UserToken token, CancellationToken cancellationToken = default);

        //Task<UserToken?> GetLatestInvitationToken(
        //Guid userId,
        //CancellationToken cancellationToken = default);

        //Task RevokeInvitationTokens(
        //Guid userId,
        //CancellationToken cancellationToken = default);

        Task<UserToken?> GetLatestToken(
        Guid userId,
        UserTokenType type,
        CancellationToken cancellationToken = default);

        Task RevokeTokens(
            Guid userId,
            UserTokenType type,
            CancellationToken cancellationToken = default);
    }

}