using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class RegisterRequest
    {
        [Required]
        [MaxLength(255)]
        [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")]
        public string Email { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = null!;

        [Required]
        [MinLength(8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\s]).*$")]
        public string Password { get; set; } = null!;
    }
}