// Immediate Session Invalidation — JTI Blacklist  author: Anas
namespace user_service.Application.Domain.Entities
{
    public class RevokedToken
    {
        public string Jti { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }
}
