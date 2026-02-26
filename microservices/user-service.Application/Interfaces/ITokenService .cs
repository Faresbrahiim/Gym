using user_service.Application.DTOs;

namespace user_service.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(UserDto user);
    }
}