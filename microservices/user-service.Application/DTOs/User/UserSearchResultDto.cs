namespace user_service.Application.DTOs
{
    public class UserSearchResultDto
    {
        public Guid   Id         { get; set; }
        public string Username   { get; set; } = default!;
        public string FirstName  { get; set; } = default!;
        public string LastName   { get; set; } = default!;
        public string Role       { get; set; } = default!;
        public string? AvatarUrl { get; set; }
    }
}
