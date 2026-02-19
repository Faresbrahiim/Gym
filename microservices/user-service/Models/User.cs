using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using user_service.Domain.Enums;

namespace user_service.Models
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

        public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

        public ICollection<CoachAvailability> CoachAvailabilities { get; set; } = new List<CoachAvailability>();
    }
}

