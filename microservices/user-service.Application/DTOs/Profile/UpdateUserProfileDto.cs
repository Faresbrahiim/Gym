using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class UpdateUserProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }

        [Url]
        public string? ProfilePictureUrl { get; set; }
    }
}
