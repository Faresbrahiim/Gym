// Immediate Session Invalidation — JTI Blacklist  author: Anas
namespace user_service.Application.Contracts.Repositories
{
    public interface IRevokedTokenRepository
    {
        Task<bool> IsRevoked(string jti, CancellationToken cancellationToken = default);
        Task Add(string jti, DateTime expiresAt, CancellationToken cancellationToken = default);
        Task AddRange(IEnumerable<(string Jti, DateTime ExpiresAt)> tokens, CancellationToken cancellationToken = default);
        Task DeleteExpired(CancellationToken cancellationToken = default);
    }
}
