namespace user_service.Application.Entities
{
    public class PasswordResetToken
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string TokenHash { get; set; } = null!;

        public DateTime ExpiresAt { get; set; }

        public DateTime? UsedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
