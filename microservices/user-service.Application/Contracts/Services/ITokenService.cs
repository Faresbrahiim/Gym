using user_service.Application.DTOs;

namespace user_service.Application.Contracts.Services
{
    public interface ITokenService
    {
        // Immediate Session Invalidation — JTI Blacklist  author: Anas
        TokenResult GenerateToken(UserDto user);
    }
}
