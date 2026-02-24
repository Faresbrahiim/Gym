namespace user_service.Application.Entities
{
    public class UserProfile
    {
        public Guid UserId { get; set; }

        public string FirstName { get; set; } = null!;

        public string LastName { get; set; } = null!;

        public string? ProfilePictureUrl { get; set; }


        public string? Phone { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
