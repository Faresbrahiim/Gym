using user_service.Application.Domain.Entities;

namespace user_service.Application.Contracts.Services
{
    public interface IPasswordCredentialService
    {
            Task<User> SetPasswordWithTokenAsync(string token, string newPassword, CancellationToken cancellationToken = default);
             Task<User> AcceptInvitationAsync(
        string rawToken,
        string password,
        CancellationToken cancellationToken = default);

            Task<string> CreateInvitationTokenAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

            Task<string> CreatePasswordResetTokenAsync(
                Guid userId,
                int expiryMinutes,
                CancellationToken cancellationToken = default);

        Task<string> CreateEmailVerificationTokenAsync(
            Guid userId,
            CancellationToken cancellationToken = default
            );

        Task<User> VerifyEmailAsync(
        string rawToken,
        CancellationToken cancellationToken = default
            );
    }

}
