
namespace user_service.Application.DTOs
{
    public class SessionDto
    {
        public Guid TokenId { get; set; }  
        public DateTime CreatedAt { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }
}
