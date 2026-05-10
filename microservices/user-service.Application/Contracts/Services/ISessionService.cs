using user_service.Application.Domain.Entities;
using user_service.Application.DTOs;

namespace user_service.Application.Contracts.Services
{
    public interface ISessionService
    {
        Task<LoginResponse> CreateSessionAsync(User user, string? password, CancellationToken cancellationToken = default);
        Task<LoginResponse> RefreshToken(string refreshToken, CancellationToken cancellationToken = default);
        Task Logout(string refreshToken);
        Task LogoutAll(Guid userId);
        Task<List<SessionDto>> GetActiveSessions(Guid userId);
        Task RevokeSession(Guid userId, Guid tokenId);
    }
}
