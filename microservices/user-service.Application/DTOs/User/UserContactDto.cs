namespace user_service.Application.DTOs
{
    public class UserContactDto
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; } = default!;
        public string Username { get; set; } = default!;
        public string? AvatarUrl { get; set; }
    }
}
