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
                .Include(u => u.ExternalLogins)
                .FirstOrDefault(u => u.Email.ToLower() == loweredEmail);
        }

      
        public User GetById(Guid userId)
        {
            return _context.Users
                .Include(u => u.Profile)
                .Include(u => u.ExternalLogins)
                .FirstOrDefault(u => u.Id == userId);
        }

      
        public ExternalLogin? GetExternalLogin(string provider, string providerUserId)
        {
            return _context.ExternalLogins
                .FirstOrDefault(e => e.Provider == provider && e.ProviderUserId == providerUserId);
        }

        
        public void AddExternalLogin(ExternalLogin externalLogin)
        {
            _context.ExternalLogins.Add(externalLogin);
            _context.SaveChanges();
        }

       
        public User Create(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges(); 

            if (user.Profile != null)
            {
                user.Profile.UserId = user.Id;
                if (!_context.UserProfiles.Any(p => p.UserId == user.Id))
                    _context.UserProfiles.Add(user.Profile);
            }

            _context.SaveChanges();
            return user;
        }

        // ✅ Update user
        public User Update(User user)
        {
            _context.Users.Update(user);
            _context.SaveChanges();
            return user;
        }
    }
}