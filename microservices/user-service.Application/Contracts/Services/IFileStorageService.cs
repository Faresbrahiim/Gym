using Microsoft.AspNetCore.Http;

namespace user_service.Application.Contracts.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveAvatarAsync(IFormFile file, Guid userId, CancellationToken cancellationToken = default);
    }
}
