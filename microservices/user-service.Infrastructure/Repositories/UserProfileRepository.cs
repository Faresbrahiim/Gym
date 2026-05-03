using Microsoft.EntityFrameworkCore;
using user_service.Application.Domain.Entities;
using user_service.Application.Contracts.Repositories;
using user_service.Infrastructure.Data;

namespace user_service.Infrastructure.Repositories
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly UserDbContext _context;

        public UserProfileRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfile?> GetByUserId(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public async Task Create(UserProfile profile, CancellationToken cancellationToken = default)
        {
            await _context.UserProfiles.AddAsync(profile, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task Update(UserProfile profile, CancellationToken cancellationToken = default)
        {
            var tracked = await _context.UserProfiles
                .AsTracking()
                .FirstOrDefaultAsync(p => p.UserId == profile.UserId, cancellationToken);

            if (tracked is null) return;

            _context.Entry(tracked).CurrentValues.SetValues(profile);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}