using user_service.Application.DTOs;

namespace user_service.Application.Contracts.Services
{
    public interface ITokenService
    {
        string GenerateToken(UserDto user);
    }
}