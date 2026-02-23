using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
    }
}
