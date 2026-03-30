namespace user_service.Application.DTOs
{
    public class GooglePayloadDto
    {
        public string Email { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string? GivenName { get; set; }
        public string? FamilyName { get; set; }
        public string? Picture { get; set; }
        public string Subject { get; set; } = default!;
        public bool EmailVerified { get; set; }
    }
}