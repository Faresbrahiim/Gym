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

        // Create a new refresh token
        public void Create(RefreshToken token)
        {
            _context.RefreshTokens.Add(token);
            _context.SaveChanges();
        }

        // Get valid (not expired, not revoked) token by hash
        public RefreshToken? GetValidToken(string tokenHash)
        {
            return _context.RefreshTokens
                .Include(t => t.User)
                .FirstOrDefault(t =>
                    t.TokenHash == tokenHash &&
                    t.RevokedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow);
        }

        // Revoke a token
        public void Revoke(RefreshToken token)
        {
            token.RevokedAt = DateTime.UtcNow;
            _context.RefreshTokens.Update(token);
            _context.SaveChanges();
        }

        // Optional: revoke all tokens of a user (e.g., on logout)
       
        public void RevokeAllTokens(Guid userId)
        {
            var tokens = _context.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToList();

            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            _context.RefreshTokens.UpdateRange(tokens);
            _context.SaveChanges();
        }
    }
}