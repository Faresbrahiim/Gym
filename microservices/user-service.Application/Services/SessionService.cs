using Microsoft.AspNetCore.Http;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Domain.Entities;
using user_service.Application.DTOs;
using user_service.Application.Helpers;
using user_service.Application.Mappers;

namespace user_service.Application.Services
{
    public class SessionService : ISessionService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IRevokedTokenRepository _revokedTokenRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IFileAuditService _fileAuditService;

        public SessionService(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IRevokedTokenRepository revokedTokenRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IHttpContextAccessor httpContextAccessor,
            IFileAuditService fileAuditService)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _revokedTokenRepository = revokedTokenRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _httpContextAccessor = httpContextAccessor;
            _fileAuditService = fileAuditService;
        }

        public async Task<LoginResponse> CreateSessionAsync(User user, string? password, CancellationToken cancellationToken = default)
        {
            if (password != null && _passwordHasher.NeedsRehash(user.PasswordHash))
                user.PasswordHash = _passwordHasher.Hash(password);

            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.Update(user, cancellationToken);

            var userDto = UserMapper.ToDto(user);
            var tokenResult = _tokenService.GenerateToken(userDto);

            var rawRefresh = TokenHelper.GenerateToken();
            var hash = TokenHelper.HashToken(rawRefresh);
            var httpContext = _httpContextAccessor.HttpContext;
            var ip = httpContext?.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

            if (!string.IsNullOrEmpty(userAgent))
                await _refreshTokenRepository.RevokeByUserAgent(user.Id, userAgent, cancellationToken);

            await _refreshTokenRepository.Create(
                AuthMapper.ToRefreshTokenEntity(Guid.NewGuid(), user.Id, hash, ip, userAgent, tokenResult),
                cancellationToken);

            await _fileAuditService.LogAsync(
                action: "log in",
                performedBy: user.Username,
                details: "User logged successfully");

            return AuthMapper.ToLoginResponse(user.Id, tokenResult.Token, rawRefresh);
        }

        public async Task<LoginResponse> RefreshToken(string refreshToken, CancellationToken cancellationToken = default)
        {
            var hash = TokenHelper.HashToken(refreshToken);
            var stored = await _refreshTokenRepository.GetValidToken(hash, cancellationToken);

            if (stored == null)
                throw new UnauthorizedAccessException("Invalid refresh token");

            var user = await _userRepository.GetById(stored.UserId, cancellationToken)
                       ?? throw new UnauthorizedAccessException();

            await _refreshTokenRepository.Revoke(stored, cancellationToken);

            var newRaw = TokenHelper.GenerateToken();
            var newHash = TokenHelper.HashToken(newRaw);
            var userDto = UserMapper.ToDto(user);
            var tokenResult = _tokenService.GenerateToken(userDto);

            var httpContext = _httpContextAccessor.HttpContext;
            var ip = httpContext?.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

            await _refreshTokenRepository.Create(
                AuthMapper.ToRefreshTokenEntity(Guid.NewGuid(), user.Id, newHash, ip, userAgent, tokenResult),
                cancellationToken);

            return AuthMapper.ToLoginResponse(user.Id, tokenResult.Token, newRaw);
        }

        public async Task Logout(string refreshToken)
        {
            var hash = TokenHelper.HashToken(refreshToken);
            var stored = await _refreshTokenRepository.GetValidToken(hash);

            if (stored == null)
                return;

            await _refreshTokenRepository.Revoke(stored);
        }

        public async Task LogoutAll(Guid userId)
        {
            var activeTokens = await _refreshTokenRepository.GetActiveTokens(userId);

            var jtisToRevoke = activeTokens
                .Where(t => t.AccessTokenJti != null && t.AccessTokenExpiresAt.HasValue)
                .Select(t => (t.AccessTokenJti!, t.AccessTokenExpiresAt!.Value))
                .ToList();

            if (jtisToRevoke.Count > 0)
                await _revokedTokenRepository.AddRange(jtisToRevoke);

            await _refreshTokenRepository.RevokeAllTokens(userId);
        }

        public async Task<List<SessionDto>> GetActiveSessions(Guid userId)
        {
            var tokens = await _refreshTokenRepository.GetActiveTokens(userId);
            return tokens.Select(AuthMapper.ToSessionDto).ToList();
        }

        public async Task RevokeSession(Guid userId, Guid tokenId)
        {
            var token = await _refreshTokenRepository.GetById(userId, tokenId);

            if (token == null)
                return;

            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            if (token.AccessTokenJti != null && token.AccessTokenExpiresAt.HasValue)
                await _revokedTokenRepository.Add(token.AccessTokenJti, token.AccessTokenExpiresAt.Value);

            await _refreshTokenRepository.Revoke(token);
        }
    }
}
