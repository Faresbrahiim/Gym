using user_service.DTOs;

namespace user_service.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(UserDto user);
    }
}
