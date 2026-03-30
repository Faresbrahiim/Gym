using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = null!;

        [Required, MinLength(8)]
        public string NewPassword { get; set; } = null!;
    }
}
