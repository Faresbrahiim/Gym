using Microsoft.EntityFrameworkCore;
using user_service.Domain.Enums;
using user_service.Models;
using user_service.Security;

namespace user_service.Data.Seeding
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
