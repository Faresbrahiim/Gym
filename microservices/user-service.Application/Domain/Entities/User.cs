
using user_service.Application.Domain.Enums;

namespace user_service.Application.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public string Email { get; set; } = null!;

        public string? PasswordHash { get; set; }

        public string Username { get; set; } = null!;

        public UserRole Role { get; set; }

        public UserStatus Status { get; set; } = UserStatus.PENDING;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        // Navigation properties
        public UserProfile? Profile { get; set; }

        public MemberProfile? MemberProfile { get; set; }

        public CoachProfile? CoachProfile { get; set; }

        public ICollection<ExternalLogin> ExternalLogins { get; set; } = new List<ExternalLogin>();


        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public ICollection<RecoveryCode> RecoveryCodes { get; set; } = new List<RecoveryCode>();

        // Navigation — 2FA config lives in its own table
        public UserTwoFactor? TwoFactor { get; set; }
    }
}

