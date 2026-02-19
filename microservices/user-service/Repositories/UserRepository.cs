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

        /***************** create method for Google login *****************/
        public User Create(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges(); // generate User.Id

            if (user.Profile != null)
            {
                user.Profile.UserId = user.Id; // make sure FK is correct
                if (!_context.UserProfiles.Any(p => p.UserId == user.Id))
                    _context.UserProfiles.Add(user.Profile);
            }

            _context.SaveChanges();
            return user;
        }



        /****************** updatte *****************/
        public User Update(User user)
        {
            _context.Users.Update(user);
            _context.SaveChanges();
            return user;
        }

    }
}
