using System.ComponentModel.DataAnnotations;
using user_service.Application.Validation;

namespace user_service.Application.DTOs
{
    public class UpdateMemberProfileDto
    {
        [RegularExpression(@"^(Male|Female|Other)$")]
        public string? Gender { get; set; }

        [DateNotInFuture]
        public DateTime? DateOfBirth { get; set; }

        [Range(50, 300)]
        public int? HeightCm { get; set; }

        [Range(20, 500)]
        public int? WeightKg { get; set; }

        [MaxLength(255)]
        public string? FitnessGoal { get; set; }

        [Range(0, 2)]
        public int? ExperienceLevel { get; set; }
    }
}
