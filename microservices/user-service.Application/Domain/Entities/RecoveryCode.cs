namespace user_service.Application.Domain.Entities
{
    public class RecoveryCode
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string CodeHash { get; set; } = null!;

        public bool Used { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UsedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}