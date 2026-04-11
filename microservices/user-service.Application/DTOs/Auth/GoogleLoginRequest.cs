using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class GoogleLoginRequest
    {
        [Required]
        public string Token { get; set; } = null!;
    }
}
