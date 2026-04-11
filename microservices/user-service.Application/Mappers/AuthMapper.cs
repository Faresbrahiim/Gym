using user_service.Application.Domain.Entities;
using user_service.Application.DTOs;

namespace user_service.Application.Mappers
{
    public static class AuthMapper
    {
        public static LoginResponse ToPendingTwoFactorResponse(Guid userId) => new()
        {
            RequiresTwoFactor = true,
            UserId = userId
        };

        public static LoginResponse ToLoginResponse(Guid userId, string accessToken, string refreshToken) => new()
        {
            RequiresTwoFactor = false,
            AccessToken       = accessToken,
            RefreshToken      = refreshToken,
            UserId            = userId
        };

        public static RefreshToken ToRefreshTokenEntity(
            Guid id,
            Guid userId,
            string tokenHash,
            string? ip,
            string? userAgent,
            TokenResult tokenResult) => new()
        {
            Id                   = id,
            UserId               = userId,
            TokenHash            = tokenHash,
            CreatedAt            = DateTime.UtcNow,
            ExpiresAt            = DateTime.UtcNow.AddDays(7),
            IpAddress            = ip,
            UserAgent            = userAgent,
            AccessTokenJti       = tokenResult.Jti,
            AccessTokenExpiresAt = tokenResult.ExpiresAt
        };

        public static SessionDto ToSessionDto(RefreshToken token) => new()
        {
            TokenId   = token.Id,
            CreatedAt = token.CreatedAt,
            IpAddress = token.IpAddress,
            UserAgent = token.UserAgent
        };
    }
}
