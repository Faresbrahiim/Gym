namespace user_service.Repositories
{
    
    using user_service.Application.Entities;
    using user_service.Application.Interfaces;
    using user_service.Infrastructure.Data;
    using Microsoft.EntityFrameworkCore;
    using user_service.Interfaces;

    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly UserDbContext _context;

        public UserProfileRepository(UserDbContext context)
        {
            _context = context;
        }

        public UserProfile? GetByUserId(Guid userId)
        {
            return _context.UserProfiles
                .FirstOrDefault(p => p.UserId == userId);
        }

        public void Create(UserProfile profile)
        {
            _context.UserProfiles.Add(profile);
            _context.SaveChanges();
        }

        public void Update(UserProfile profile)
        {
            _context.UserProfiles.Update(profile);
            _context.SaveChanges();
        }
    }
}
