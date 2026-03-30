using user_service.Application.Domain.Enums;

namespace user_service.Application.Domain.Entities
{
   

    public class MemberProfile
    {
        public Guid UserId { get; set; }

        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public int? HeightCm { get; set; }

        public int? WeightKg { get; set; }

        public string? FitnessGoal { get; set; }

        public ExperienceLevel? ExperienceLevel { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }

}

