namespace user_service.Application.DTOs
{
    public class UpdateMemberProfileDto
    {
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? HeightCm { get; set; }
        public int? WeightKg { get; set; }
        public string? FitnessGoal { get; set; }
        public int? ExperienceLevel { get; set; }
    }
}
