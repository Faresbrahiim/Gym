using user_service.DTOs;

namespace user_service.Interfaces
{
    public interface IAuthService
    {
        LoginResponse LoginWithEmail(LoginRequest request);
        LoginResponse LoginWithGoogle(GoogleLoginRequest request);
    }
}
