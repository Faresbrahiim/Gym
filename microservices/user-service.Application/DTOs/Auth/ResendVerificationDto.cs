using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class ResendVerificationDto
    {
        [Required]
        [MaxLength(255)]
        [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")]
        public string Email { get; set; } = null!;
    }
}
