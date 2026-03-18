using user_service.Application.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace user_service.Application.Interfaces
{
    public interface IRefreshTokenRepository
    {
        Task Create(RefreshToken token, CancellationToken cancellationToken = default);
        Task<RefreshToken?> GetValidToken(string tokenHash, CancellationToken cancellationToken = default);
        Task Revoke(RefreshToken token, CancellationToken cancellationToken = default);
        Task RevokeAllTokens(Guid userId, CancellationToken cancellationToken = default);
        Task<List<RefreshToken>> GetActiveTokens(Guid userId);

    }
}