using user_service.Application.Domain.Entities;

namespace user_service.Application.Contracts.Repositories
{
    public interface IPasswordResetTokenRepository
    {
        Task Create(
            PasswordResetToken token,
            CancellationToken cancellationToken = default);

        Task<PasswordResetToken?> GetValidToken(
            string tokenHash,
            CancellationToken cancellationToken = default);

        Task Update(
            PasswordResetToken token,
            CancellationToken cancellationToken = default);
    }
}