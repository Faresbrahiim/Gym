using Microsoft.EntityFrameworkCore;
using user_service.Data;
using user_service.Interfaces;
using user_service.Models;

namespace user_service.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserDbContext _context;

        public UserRepository(UserDbContext context)
        {
            _context = context;
        }

        public User GetByEmail(string email)
        {
            var loweredEmail = email.ToLower();
            return _context.Users
                .Include(u => u.Profile)
                .FirstOrDefault(u => u.Email.ToLower() == loweredEmail);
        }
    }
}
