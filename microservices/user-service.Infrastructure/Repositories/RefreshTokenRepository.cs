using Microsoft.EntityFrameworkCore;
using user_service.Application.Domain.Entities;
using user_service.Infrastructure.Data;
using user_service.Application.Contracts.Repositories;

namespace user_service.Infrastructure.Repositories
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly UserDbContext _context;

        public RefreshTokenRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task Create(RefreshToken token, CancellationToken cancellationToken = default)
        {
            await _context.RefreshTokens.AddAsync(token, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<RefreshToken?> GetValidToken(string tokenHash, CancellationToken cancellationToken = default)
        {
            return await _context.RefreshTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.RevokedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow, cancellationToken);
        }

        public async Task Revoke(string tokenHash, CancellationToken cancellationToken = default)
        {
            var token = await _context.RefreshTokens
                .AsTracking()
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.RevokedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow, cancellationToken);

            if (token is null) return;

            token.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task RevokeAllTokens(Guid userId, CancellationToken cancellationToken = default)
        {
            var tokens = await _context.RefreshTokens
                .AsTracking()
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in tokens)
                token.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<List<RefreshToken>> GetActiveTokens(Guid userId)
        {
            return await _context.RefreshTokens
                .Where(t =>
                    t.UserId == userId &&
                    t.RevokedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task<RefreshToken?> GetById(Guid userId, Guid tokenId)
        {
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(t =>
                    t.Id == tokenId &&
                    t.UserId == userId &&
                    t.RevokedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow);
        }

        public async Task RevokeByUserAgent(Guid userId, string userAgent, CancellationToken cancellationToken = default)
        {
            var tokens = await _context.RefreshTokens
                .AsTracking()
                .Where(t =>
                    t.UserId == userId &&
                    t.UserAgent == userAgent &&
                    t.RevokedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            if (tokens.Count == 0) return;

            foreach (var token in tokens)
                token.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}