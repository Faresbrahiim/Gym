
namespace user_service.Application.DTOs
{
    public class UserProfileDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}
