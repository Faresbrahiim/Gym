using Microsoft.EntityFrameworkCore;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Domain.Entities;
using user_service.Infrastructure.Data;

namespace user_service.Infrastructure.Repositories
{
    public class MemberProfileRepository : IMemberProfileRepository
    {
        private readonly UserDbContext _context;

        public MemberProfileRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task<MemberProfile?> GetByUserId(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.MemberProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public async Task Create(MemberProfile profile, CancellationToken cancellationToken = default)
        {
            await _context.MemberProfiles.AddAsync(profile, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task Update(MemberProfile profile, CancellationToken cancellationToken = default)
        {
            var tracked = await _context.MemberProfiles
                .AsTracking()
                .FirstOrDefaultAsync(p => p.UserId == profile.UserId, cancellationToken);

            if (tracked is null) return;

            _context.Entry(tracked).CurrentValues.SetValues(profile);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}