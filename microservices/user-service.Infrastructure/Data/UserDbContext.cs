using Microsoft.EntityFrameworkCore;
using user_service.Application.Enums;
using user_service.Application.Entities;

namespace user_service.Infrastructure.Data
{
    public class UserDbContext:DbContext
    {
        public UserDbContext(DbContextOptions<UserDbContext> options)
       : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
        public DbSet<MemberProfile> MemberProfiles => Set<MemberProfile>();
        public DbSet<CoachProfile> CoachProfiles => Set<CoachProfile>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<CoachAvailability> CoachAvailabilities => Set<CoachAvailability>();

        public DbSet<ExternalLogin> ExternalLogins { get; set; } = null!;


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Explicit PostgreSQL enum names (production-safe)
            modelBuilder.HasPostgresEnum<UserRole>("user_role");
            modelBuilder.HasPostgresEnum<UserStatus>("user_status");

            
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(UserDbContext).Assembly);
        }
    }
}
