using Microsoft.EntityFrameworkCore;
using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;
using user_service.Application.Contracts.Repositories;
using user_service.Infrastructure.Data;

namespace user_service.Infrastructure.Repositories
{
    public class UserTokenRepository : IUserTokenRepository
    {
        private readonly UserDbContext _context;

        public UserTokenRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task Create(UserToken token, CancellationToken cancellationToken = default)
        {
            await _context.UserTokens.AddAsync(token, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<UserToken?> GetValidToken(
            string tokenHash,
            UserTokenType type,
            CancellationToken cancellationToken = default)
        {
            return await _context.UserTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.Type == type &&
                    t.UsedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow,
                    cancellationToken);
        }

        public async Task Update(UserToken token, CancellationToken cancellationToken = default)
        {
            var tracked = await _context.UserTokens
                .AsTracking()
                .FirstOrDefaultAsync(t => t.Id == token.Id, cancellationToken);

            if (tracked is null) return;

            _context.Entry(tracked).CurrentValues.SetValues(token);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<UserToken?> GetLatestToken(
            Guid userId,
            UserTokenType type,
            CancellationToken cancellationToken = default)
        {
            return await _context.UserTokens
                .Where(t => t.UserId == userId && t.Type == type)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task RevokeTokens(
            Guid userId,
            UserTokenType type,
            CancellationToken cancellationToken = default)
        {
            var tokens = await _context.UserTokens
                .AsTracking()
                .Where(t =>
                    t.UserId == userId &&
                    t.Type == type &&
                    t.UsedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in tokens)
                token.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}