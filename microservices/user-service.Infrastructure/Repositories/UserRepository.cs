using Microsoft.EntityFrameworkCore;
using user_service.Infrastructure.Data;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;

namespace user_service.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserDbContext _context;

        public UserRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmail(string email, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Profile)
                .Include(u => u.ExternalLogins)
                .Include(u => u.TwoFactor)
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        }

        public async Task<User?> GetById(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                //.AsNoTracking()
                .Include(u => u.Profile)
                .Include(u => u.ExternalLogins)
                .Include(u => u.TwoFactor)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }

        public async Task<ExternalLogin?> GetExternalLogin(string provider, string providerUserId, CancellationToken cancellationToken = default)
        {
            return await _context.ExternalLogins
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Provider == provider && e.ProviderUserId == providerUserId, cancellationToken);
        }

        public async Task AddExternalLogin(ExternalLogin externalLogin, CancellationToken cancellationToken = default)
        {
            await _context.ExternalLogins.AddAsync(externalLogin, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<User> Create(User user, CancellationToken cancellationToken = default)
        {
            await _context.Users.AddAsync(user, cancellationToken);

            if (user.Profile != null)
            {
                user.Profile.UserId = user.Id;
                await _context.UserProfiles.AddAsync(user.Profile, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);
            return user;
        }

        public async Task<User> Update(User user, CancellationToken cancellationToken = default)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);
            return user;
        }

        public async Task<User?> GetByUsername(string username, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        }
        public async Task<User?> GetFullById(
        Guid userId,
        CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.MemberProfile)
                .Include(u => u.CoachProfile)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }

        public async Task UpsertTwoFactor(UserTwoFactor twoFactor, CancellationToken cancellationToken = default)
        {
            var existing = await _context.UserTwoFactors
                .FirstOrDefaultAsync(t => t.UserId == twoFactor.UserId, cancellationToken);

            if (existing == null)
            {
                await _context.UserTwoFactors.AddAsync(twoFactor, cancellationToken);
            }
            else
            {
                existing.Secret    = twoFactor.Secret;
                existing.IsEnabled = twoFactor.IsEnabled;
                existing.UpdatedAt = twoFactor.UpdatedAt;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Profile)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<User>> SearchAsync(
            string query,
            int limit,
            CancellationToken cancellationToken = default)
        {
            var pattern = $"%{query}%";

            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Profile)
                .Where(u =>
                    u.Status == UserStatus.ACTIVE &&
                    (u.Role == UserRole.MEMBER || u.Role == UserRole.COACH) &&
                    (
                        EF.Functions.ILike(u.Username, pattern) ||
                        (u.Profile != null && EF.Functions.ILike(u.Profile.FirstName, pattern)) ||
                        (u.Profile != null && EF.Functions.ILike(u.Profile.LastName, pattern))
                    ))
                .OrderBy(u => u.Username)
                .Take(limit)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<User>> GetByIdsAsync(
            IEnumerable<Guid> userIds,
            CancellationToken cancellationToken = default)
        {
            var ids = userIds.Distinct().ToList();
            if (ids.Count == 0)
                return [];

            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Profile)
                .Where(u => ids.Contains(u.Id))
                .ToListAsync(cancellationToken);
        }
    }
}
