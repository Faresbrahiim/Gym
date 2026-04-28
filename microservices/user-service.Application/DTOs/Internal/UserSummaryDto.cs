namespace user_service.Application.DTOs
{
    public class UserSummaryDto
    {
        public Guid Id { get; init; }
        public string FullName { get; init; } = string.Empty;
        public string ProfilePictureUrl { get; init; } = string.Empty;
    }
}
