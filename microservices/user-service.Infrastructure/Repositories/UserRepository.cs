using Microsoft.EntityFrameworkCore;
using user_service.Application.Common;
using user_service.Application.DTOs;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Infrastructure.Data;

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
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        }

        public async Task<User?> GetById(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                //.AsNoTracking()
                .Include(u => u.Profile)
                .Include(u => u.ExternalLogins)
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
        public async Task<PagedResult<UserListDto>> GetUsersForAdminAsync(
    int page,
    int pageSize,
    string? search,
    UserRole? role,
    UserStatus? status)
        {
            var query = _context.Users
                .Include(u => u.Profile)
                .Include(u => u.MemberProfile)
                .AsQueryable();

            //  Search
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u =>
                    u.Email.Contains(search) ||
                    u.Username.Contains(search));
            }

            //  Filter by Role
            if (role.HasValue)
                query = query.Where(u => u.Role == role.Value);

            //  Filter by Status
            if (status.HasValue)
                query = query.Where(u => u.Status == status.Value);

            var totalCount = await query.CountAsync();

            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString(),
                    FirstName = u.Profile.FirstName,
                    LastName = u.Profile.LastName,
                    Phone = u.Profile.Phone,
                    FitnessGoal = u.MemberProfile != null
                        ? u.MemberProfile.FitnessGoal
                        : null
                })
                .ToListAsync();

            return new PagedResult<UserListDto>
            {
                Items = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }
    }
}