using user_service.DTOs;
using user_service.Interfaces;

public class AuthService : IAuthService
{
    public LoginResponse LoginWithEmail(LoginRequest request)
    {
        // implement login logic
        return new LoginResponse
        { };
    }

    public LoginResponse LoginWithGoogle(GoogleLoginRequest request)
    {
        // implement Google login
        return new LoginResponse
        { };
    }
}
