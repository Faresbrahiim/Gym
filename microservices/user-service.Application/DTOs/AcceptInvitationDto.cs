using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class AcceptInvitationDto
    {
        [Required]
        public string Token { get; set; } = null!;
        [Required]
        public string Password { get; set; } = null!;
    }
}