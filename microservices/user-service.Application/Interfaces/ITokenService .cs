using user_service.Application.DTOs;

namespace user_service.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(UserDto user);
    }
}
