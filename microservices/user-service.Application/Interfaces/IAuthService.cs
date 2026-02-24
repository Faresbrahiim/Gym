using user_service.Application.DTOs;

namespace user_service.Application.Interfaces
{
    public interface IAuthService
    {
        LoginResponse LoginWithEmail(LoginRequest request);
        LoginResponse LoginWithGoogle(GoogleLoginRequest request);

        Task<UserDto> RegisterAsync(RegisterRequest request);

        void RequestPasswordReset(RequestPasswordResetDto dto);
        void ResetPassword(ResetPasswordDto dto);

    }
}
