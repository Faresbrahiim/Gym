using System.ComponentModel.DataAnnotations;

namespace user_service.Application.DTOs
{
    public class UpdateUserProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        [RegularExpression(@"^(\+212|0)(5|6|7)\d{8}$")]
        public string? Phone { get; set; }

        [Url]
        public string? ProfilePictureUrl { get; set; }
    }
}
