namespace user_service.Models
{
    public class CoachProfile
    {
        public Guid UserId { get; set; }

        public string? Bio { get; set; }

        public int? YearsOfExperience { get; set; }

        public string? Certifications { get; set; }

        public string Language { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
