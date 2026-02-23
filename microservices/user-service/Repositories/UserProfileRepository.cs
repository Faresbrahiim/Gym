namespace user_service.Repositories
{
    using user_service.Data;
    using user_service.Interfaces;
    using user_service.Models;

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
