using System.ComponentModel.DataAnnotations;

namespace user_service.DTOs
{
    public class RequestPasswordResetDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;
    }
}
