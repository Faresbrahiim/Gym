namespace user_service.Application.Domain.Entities
{
    public class UserTwoFactor
    {
        public Guid UserId { get; set; }

        public bool IsEnabled { get; set; } = false;

        public string? Secret { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
