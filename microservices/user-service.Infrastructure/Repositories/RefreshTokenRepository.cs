using Microsoft.EntityFrameworkCore;
using user_service.Application.Entities;
using user_service.Infrastructure.Data;
using user_service.Application.Interfaces;

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

        public async Task Revoke(RefreshToken token, CancellationToken cancellationToken = default)
        {
            token.RevokedAt = DateTime.UtcNow;
            _context.RefreshTokens.Update(token);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task RevokeAllTokens(Guid userId, CancellationToken cancellationToken = default)
        {
            var tokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            _context.RefreshTokens.UpdateRange(tokens);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}