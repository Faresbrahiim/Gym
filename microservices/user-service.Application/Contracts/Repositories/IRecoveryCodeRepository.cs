using user_service.Application.Domain.Entities;

namespace user_service.Application.Contracts.Repositories
{
    public interface IRecoveryCodeRepository
    {
        Task CreateMany(List<RecoveryCode> codes, CancellationToken cancellationToken = default);

        Task<RecoveryCode?> GetValidCode(Guid userId, string codeHash, CancellationToken cancellationToken = default);

        Task MarkUsed(RecoveryCode code, CancellationToken cancellationToken = default);

        Task InvalidateAll(Guid userId, CancellationToken cancellationToken = default);
    }
}