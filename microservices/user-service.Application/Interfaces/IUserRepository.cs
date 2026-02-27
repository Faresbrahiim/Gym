using user_service.Application.Common;
using user_service.Application.DTOs;
using user_service.Application.Entities;
using user_service.Application.Enums;

namespace user_service.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmail(
            string email,
            CancellationToken cancellationToken = default);

        Task<User?> GetById(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task<User?> GetByUsername(
            string username,
            CancellationToken cancellationToken = default);

        Task<ExternalLogin?> GetExternalLogin(
            string provider,
            string providerUserId,
            CancellationToken cancellationToken = default);

        Task AddExternalLogin(
            ExternalLogin externalLogin,
            CancellationToken cancellationToken = default);

        Task<User> Create(
            User user,
            CancellationToken cancellationToken = default);

        Task<User> Update(
            User user,
            CancellationToken cancellationToken = default);
        Task<PagedResult<UserListDto>> GetUsersForAdminAsync(
            int page,
            int pageSize,
            string? search,
            UserRole? role,
            UserStatus? status);
    }
}