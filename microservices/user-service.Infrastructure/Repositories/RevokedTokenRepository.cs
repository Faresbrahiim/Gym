// Immediate Session Invalidation — JTI Blacklist  author: Anas
using Microsoft.EntityFrameworkCore;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Domain.Entities;
using user_service.Infrastructure.Data;

namespace user_service.Infrastructure.Repositories
{
    public class RevokedTokenRepository : IRevokedTokenRepository
    {
        private readonly UserDbContext _context;

        public RevokedTokenRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsRevoked(string jti, CancellationToken cancellationToken = default)
        {
            return await _context.RevokedTokens
                .AnyAsync(t => t.Jti == jti && t.ExpiresAt > DateTime.UtcNow, cancellationToken);
        }

        public async Task Add(string jti, DateTime expiresAt, CancellationToken cancellationToken = default)
        {
            await _context.RevokedTokens.AddAsync(
                new RevokedToken { Jti = jti, ExpiresAt = expiresAt },
                cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task AddRange(IEnumerable<(string Jti, DateTime ExpiresAt)> tokens, CancellationToken cancellationToken = default)
        {
            var entities = tokens.Select(t => new RevokedToken { Jti = t.Jti, ExpiresAt = t.ExpiresAt });
            await _context.RevokedTokens.AddRangeAsync(entities, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteExpired(CancellationToken cancellationToken = default)
        {
            var expired = await _context.RevokedTokens
                .AsTracking()
                .Where(t => t.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            _context.RevokedTokens.RemoveRange(expired);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}