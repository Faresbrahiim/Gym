using Microsoft.EntityFrameworkCore;
using user_service.Data;
using user_service.Interfaces;
using user_service.Models;

namespace user_service.Repositories
{
    public class PasswordResetTokenRepository : IPasswordResetTokenRepository
    {

        private readonly UserDbContext _context;

        public PasswordResetTokenRepository(UserDbContext context)
        {
            _context = context;
        }

        // Create a new token
        public void Create(PasswordResetToken token)
        {
            _context.PasswordResetTokens.Add(token);
            _context.SaveChanges();
        }

        // Get a valid token (not used and not expired)
        public PasswordResetToken? GetValidToken(string tokenHash)
        {
            return _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefault(t =>
                    t.TokenHash == tokenHash &&
                    t.UsedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow);
        }

        // Update token (e.g., mark as used)
        public void Update(PasswordResetToken token)
        {
            _context.PasswordResetTokens.Update(token);
            _context.SaveChanges();
        }
    }
}
