using Microsoft.EntityFrameworkCore;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Domain.Entities;
using user_service.Infrastructure.Data;

namespace user_service.Infrastructure.Repositories
{
    public class CoachProfileRepository : ICoachProfileRepository
    {
        private readonly UserDbContext _context;

        public CoachProfileRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task<CoachProfile?> GetByUserId(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.CoachProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public async Task Create(CoachProfile profile, CancellationToken cancellationToken = default)
        {
            await _context.CoachProfiles.AddAsync(profile, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task Update(CoachProfile profile, CancellationToken cancellationToken = default)
        {
            _context.CoachProfiles.Update(profile);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
