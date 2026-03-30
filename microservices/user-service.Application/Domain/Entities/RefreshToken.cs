namespace user_service.Application.Domain.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; } 

        public string TokenHash { get; set; } = null!;

        public DateTime ExpiresAt { get; set; }

        public DateTime? RevokedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public string? UserAgent { get; set; }

        public string? IpAddress { get; set; }



        // Navigation
        public User User { get; set; } = null!;
    }
}
