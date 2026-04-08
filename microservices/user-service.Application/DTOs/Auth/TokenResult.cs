// Immediate Session Invalidation — JTI Blacklist  author: Anas
namespace user_service.Application.DTOs
{
    public record TokenResult(string Token, string Jti, DateTime ExpiresAt);
}
