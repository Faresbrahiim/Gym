using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class AcceptInvitationDto
    {
        [Required]
        public string Token { get; set; } = null!;
        [Required]
        [MinLength(8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\s]).*$")]
        public string Password { get; set; } = null!;
    }
}