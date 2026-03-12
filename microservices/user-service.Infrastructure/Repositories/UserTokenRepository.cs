using Microsoft.EntityFrameworkCore;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Infrastructure.Data;

namespace user_service.Repositories
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
                    cancellationToken
                );
        }

        public async Task Update(UserToken token, CancellationToken cancellationToken = default)
        {
            _context.UserTokens.Update(token);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}