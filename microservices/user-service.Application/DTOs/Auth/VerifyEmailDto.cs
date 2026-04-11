using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class VerifyEmailDto
    {
        [Required]
        public string Token { get; set; } = null!;
    }
}
