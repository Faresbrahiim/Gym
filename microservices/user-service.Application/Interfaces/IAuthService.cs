using user_service.Application.DTOs;

namespace user_service.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginWithEmail(LoginRequest request, CancellationToken cancellationToken = default);
        Task<LoginResponse> LoginWithGoogle(GoogleLoginRequest request, CancellationToken cancellationToken = default);
        Task Logout(Guid userId);
        Task<UserDto> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

        Task RequestPasswordReset(RequestPasswordResetDto dto, CancellationToken cancellationToken = default);
        Task ResetPassword(ResetPasswordDto dto, CancellationToken cancellationToken = default);

        Task ResendInvitationAsync(string email , CancellationToken cancellationToken = default);
    }
}