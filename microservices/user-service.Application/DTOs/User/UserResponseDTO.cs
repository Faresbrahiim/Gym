
namespace user_service.Application.DTOs
{
    public class UserResponseDTO
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = default!;
        public string Email { get; set; } = default!;

        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? Role { get; set; }

        public bool IsOnline { get; set; }
    }
}