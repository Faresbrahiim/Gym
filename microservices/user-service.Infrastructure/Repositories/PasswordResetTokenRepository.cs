using Microsoft.EntityFrameworkCore;
using user_service.Infrastructure.Data;
using user_service.Application.Entities;
using user_service.Application.Interfaces;

namespace user_service.Repositories
{
    public class PasswordResetTokenRepository : IPasswordResetTokenRepository
    {
        private readonly UserDbContext _context;

        public PasswordResetTokenRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task Create(PasswordResetToken token, CancellationToken cancellationToken = default)
        {
            await _context.PasswordResetTokens.AddAsync(token, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<PasswordResetToken?> GetValidToken(string tokenHash, CancellationToken cancellationToken = default)
        {
            return await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.UsedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow,
                    cancellationToken
                );
        }

        public async Task Update(PasswordResetToken token, CancellationToken cancellationToken = default)
        {
            _context.PasswordResetTokens.Update(token);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}