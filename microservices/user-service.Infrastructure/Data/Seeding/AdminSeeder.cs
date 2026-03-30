using Microsoft.EntityFrameworkCore;
using user_service.Application.Domain.Enums;
using user_service.Application.Domain.Entities;
using user_service.Infrastructure.Auth;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using Microsoft.Extensions.Configuration;
namespace user_service.Infrastructure.Data.Seeding
{
    public class AdminSeeder
    {
        private readonly IPasswordHasher _passwordHasher;

        public AdminSeeder(IPasswordHasher passwordHasher)
        {
            _passwordHasher = passwordHasher;
        }

        public async Task SeedAsync(
            UserDbContext context,
            IConfiguration configuration)
        {
            var adminEmail = configuration["BootstrapAdmin:Email"];
            var adminPassword = configuration["BootstrapAdmin:Password"];

            if (string.IsNullOrWhiteSpace(adminEmail) ||
                string.IsNullOrWhiteSpace(adminPassword))
            {
                return;
            }

            var adminExists = await context.Users
                .AnyAsync(u => u.Role == UserRole.ADMIN);

            if (adminExists)
                return;

            var now = DateTime.UtcNow;
            var userId = Guid.NewGuid();

            var hashedPassword = _passwordHasher.Hash(adminPassword);

            var admin = new User
            {
                Id = userId,
                Email = adminEmail,
                PasswordHash = hashedPassword,
                Role = UserRole.ADMIN,
                Username = "SUPER ADMIN",
                Status = UserStatus.ACTIVE,
                CreatedAt = now,
                UpdatedAt = now
            };

            var profile = new UserProfile
            {
                UserId = userId,
                FirstName = "System",
                LastName = "Admin",
                Phone = null,
                CreatedAt = now,
                UpdatedAt = now
            };

            context.Users.Add(admin);
            context.UserProfiles.Add(profile);

            await context.SaveChangesAsync();
        }
    }
}
