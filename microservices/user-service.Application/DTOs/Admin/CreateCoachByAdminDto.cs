
using System.ComponentModel.DataAnnotations;


namespace user_service.Application.DTOs
{
    public class CreateCoachByAdminDto
    {
        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = null!;
    }
}
