using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class UpdateCoachProfileDto
    {
        [MaxLength(1000)]
        public string? Bio { get; set; }

        [Range(0, 60)]
        public int? YearsOfExperience { get; set; }

        [MaxLength(500)]
        public string? Certifications { get; set; }

        [MaxLength(100)]
        public string? Language { get; set; }
    }
}
