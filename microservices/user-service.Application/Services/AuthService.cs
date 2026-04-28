using user_service.Application.DTOs;
using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;
using user_service.Application.Domain.Events;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Mappers;

using user_service.Application.Domain.Exceptions;
using user_service.Application.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace user_service.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITwoFactorService _twoFactorService;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IEmailService _emailService;
        private readonly IGoogleAuthValidator _googleAuthValidator;
        private readonly IFileAuditService _fileAuditService;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IPasswordCredentialService _passwordCredentialService;
        private readonly IUserTokenRepository _userTokenRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IRecoveryCodeRepository _recoveryCodeRepository;
        private readonly IEventPublisher _eventPublisher;
        // Immediate Session Invalidation — JTI Blacklist  author: Anas
        private readonly IRevokedTokenRepository _revokedTokenRepository;

        private readonly int _passwordResetExpiryMinutes;
        private readonly string _frontendBaseUrl;

        public AuthService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IUserProfileRepository userProfileRepository,
            IEmailService emailService,
            IGoogleAuthValidator googleAuthValidator,
            IRefreshTokenRepository refreshTokenRepository,
            IFileAuditService fileAuditService,
            IUserTokenRepository userTokenRepository,
            IPasswordCredentialService passwordCredentialService,
            IHttpContextAccessor httpContextAccessor,
            ITwoFactorService twoFactorService,
            IRecoveryCodeRepository recoveryCodeRepository,
            IEventPublisher eventPublisher,
            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            IRevokedTokenRepository revokedTokenRepository,
            IConfiguration configuration)

        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _userProfileRepository = userProfileRepository;
            _emailService = emailService;
            _googleAuthValidator = googleAuthValidator;
            _refreshTokenRepository = refreshTokenRepository;
            

            _passwordResetExpiryMinutes =
                int.TryParse(Environment.GetEnvironmentVariable("PASSWORD_RESET_TOKEN_EXPIRY_MINUTES"), out var minutes)
                ? minutes
                : 30;
            _fileAuditService = fileAuditService;
            _passwordCredentialService = passwordCredentialService;
            _userTokenRepository = userTokenRepository;
            _httpContextAccessor = httpContextAccessor;
            _twoFactorService = twoFactorService;
            _recoveryCodeRepository = recoveryCodeRepository;
            _eventPublisher = eventPublisher;
            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            _revokedTokenRepository = revokedTokenRepository;
            _frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:4200";
        }

        // -----------------------------------------------------
        // LOGIN EMAIL (unchanged)
        // -----------------------------------------------------
        public async Task<LoginResponse> LoginWithEmail(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email.Trim().ToLower();
            var user = await _userRepository.GetByEmail(email, cancellationToken);

            if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException();

            if (user.Status != UserStatus.ACTIVE)
                throw new AccountNotActivatedException();

            if (user.TwoFactor?.IsEnabled == true)
                return AuthMapper.ToPendingTwoFactorResponse(user.Id);

            return await CompleteLoginAsync(user, request.Password, cancellationToken);
        }

        // -----------------------------------------------------
        // LOGIN GOOGLE (unchanged)
        // -----------------------------------------------------
        public async Task<LoginResponse> LoginWithGoogle(GoogleLoginRequest request, CancellationToken cancellationToken = default)
        {
            var payload = await _googleAuthValidator.ValidateIdToken(request.Token)
                ?? throw new ExternalAuthException("Invalid Google token");

            if (!payload.EmailVerified)
                throw new ExternalAuthException("Google email not verified");

            var externalLogin = await _userRepository.GetExternalLogin("Google", payload.Subject, cancellationToken);

            User user;

            if (externalLogin != null)
            {
                user = await _userRepository.GetById(externalLogin.UserId, cancellationToken)
                    ?? throw new ExternalAuthException("User not found");

                if (user.Status != UserStatus.ACTIVE)
                    throw new ExternalAuthException("User account is not active");
            }
            else
            {
                user = UserMapper.FromGooglePayload(payload);
                await _userRepository.Create(user, cancellationToken);

                await _userRepository.AddExternalLogin(new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = "Google",
                    ProviderUserId = payload.Subject,
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await _eventPublisher.PublishAsync(
                    "auth.user.activated",
                    new UserActivatedEvent { UserId = user.Id, Email = user.Email, Role = user.Role.ToString() },
                    cancellationToken);
            }

            if (user.TwoFactor?.IsEnabled == true)
                return AuthMapper.ToPendingTwoFactorResponse(user.Id);

            return await CompleteLoginAsync(user, null, cancellationToken);
        }

        // -----------------------------------------------------
        // REGISTER
        // -----------------------------------------------------
        public async Task<UserDto> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email.Trim().ToLower();

            if (await _userRepository.GetByEmail(email, cancellationToken) != null)
                throw new EmailAlreadyExistsException(email);

            if (await _userRepository.GetByUsername(request.Username, cancellationToken) != null)
                throw new UsernameAlreadyExistsException(request.Username);

            var passwordHash = _passwordHasher.Hash(request.Password);

            var user    = UserMapper.FromRegisterRequest(email, request.Username, passwordHash);
            var profile = ProfileMapper.NewUserProfile(user.Id, request.FirstName, request.LastName, DateTime.UtcNow);

            await _userRepository.Create(user, cancellationToken);
            await _userProfileRepository.Create(profile, cancellationToken);

            var rawToken = await _passwordCredentialService
                .CreateEmailVerificationTokenAsync(user.Id, cancellationToken);

            var verificationLink = $"{_frontendBaseUrl}/verify-email?token={Uri.EscapeDataString(rawToken)}";

            await _emailService.SendEmailVerification(user.Email, verificationLink);

            await _fileAuditService.LogAsync(
            action: "RegisterUser",
            performedBy: profile.User?.Username ?? user.Username,
            details: "User registered successfully"
            );

            await _eventPublisher.PublishAsync(
                "auth.user.registered",
                new UserRegisteredEvent { UserId = user.Id, Email = user.Email },
                cancellationToken);

            return UserMapper.ToDto(user);
        }

        // -----------------------------------------------------
        // PASSWORD RESET (unchanged)
        // -----------------------------------------------------
        public async Task RequestPasswordReset(RequestPasswordResetDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.Trim().ToLower();
            var user = await _userRepository.GetByEmail(email, cancellationToken);
            if (user == null) return;

            var rawToken = await _passwordCredentialService
                .CreatePasswordResetTokenAsync(
                    user.Id,
                    _passwordResetExpiryMinutes,
                    cancellationToken);

            var resetLink = $"{_frontendBaseUrl}/change-password?token={rawToken}";
            await _emailService.SendPasswordResetEmail(user.Email, resetLink);
            await _fileAuditService.LogAsync(
         action: "request reset password  ",
         performedBy: user.Username,
         details: "link sent "
        );
        }

        public async Task ResetPassword(ResetPasswordDto dto, CancellationToken cancellationToken = default)
        {
            var user = await _passwordCredentialService.SetPasswordWithTokenAsync(
                    dto.Token,
                    dto.NewPassword,
                    cancellationToken
             );
            await _fileAuditService.LogAsync(
            action: "reset password  ",
            performedBy: user.Username,
            details: "User reseted successfully"
           );
        }

        // -----------------------------------------------------
        // ⭐ COMPLETE LOGIN WITH REAL REFRESH TOKEN
        // -----------------------------------------------------
        private async Task<LoginResponse> CompleteLoginAsync(User user, string? password, CancellationToken cancellationToken)
        {
            if (password != null && _passwordHasher.NeedsRehash(user.PasswordHash))
                user.PasswordHash = _passwordHasher.Hash(password);

            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.Update(user, cancellationToken);

            var userDto = UserMapper.ToDto(user);
            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            var tokenResult = _tokenService.GenerateToken(userDto);

            var rawRefresh = TokenHelper.GenerateToken();
            var hash = TokenHelper.HashToken(rawRefresh);
            var httpContext = _httpContextAccessor.HttpContext;
            var ip = httpContext?.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

            // fix session revoke
            if (!string.IsNullOrEmpty(userAgent))
                await _refreshTokenRepository.RevokeByUserAgent(user.Id, userAgent, cancellationToken);

            await _refreshTokenRepository.Create(
                AuthMapper.ToRefreshTokenEntity(Guid.NewGuid(), user.Id, hash, ip, userAgent, tokenResult),
                cancellationToken);

            await _fileAuditService.LogAsync(
                action: "log in  ",
                performedBy: user.Username,
                details: "User logged successfully"
            );

            return AuthMapper.ToLoginResponse(user.Id, tokenResult.Token, rawRefresh);
        }

        // -----------------------------------------------------
        // ⭐ REFRESH TOKEN
        // -----------------------------------------------------
        public async Task<LoginResponse> RefreshToken(string refreshToken, CancellationToken cancellationToken = default)
        {
            var hash = TokenHelper.HashToken(refreshToken);
            var stored = await _refreshTokenRepository.GetValidToken(hash, cancellationToken);
            var httpContext = _httpContextAccessor.HttpContext;

            var ip = httpContext?.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

            if (stored == null)
                throw new UnauthorizedAccessException("Invalid refresh token");

            var user = await _userRepository.GetById(stored.UserId, cancellationToken)
                       ?? throw new UnauthorizedAccessException();

            // revoke old
            await _refreshTokenRepository.Revoke(stored, cancellationToken);

            // create new
            var newRaw = TokenHelper.GenerateToken();
            var newHash = TokenHelper.HashToken(newRaw);
            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            var userDto = UserMapper.ToDto(user);
            var tokenResult = _tokenService.GenerateToken(userDto);

            await _refreshTokenRepository.Create(
                AuthMapper.ToRefreshTokenEntity(Guid.NewGuid(), user.Id, newHash, ip, userAgent, tokenResult),
                cancellationToken);

            return AuthMapper.ToLoginResponse(user.Id, tokenResult.Token, newRaw);
        }
        public async Task Logout(string refreshToken)
        {
            var hash = TokenHelper.HashToken(refreshToken);

            var stored = await _refreshTokenRepository
                .GetValidToken(hash);

            if (stored == null)
                return;

            await _refreshTokenRepository.Revoke(stored);
        }

        public async Task ResendInvitationAsync(string email, CancellationToken cancellationToken = default)
        {
            await ResendUserTokenAsync(
         email,
         UserTokenType.INVITATION,
         "setup-password",
         _emailService.SendInvitationEmail,
         cancellationToken
            );
        }

        public async Task ResendEmailVerificationAsync(
            string email,
            CancellationToken cancellationToken = default)
        {
            await ResendUserTokenAsync(
                email,
                UserTokenType.EMAIL_VERIFICATION,
                "verify-email",
                _emailService.SendEmailVerification,
                cancellationToken
            );
        }

        private async Task ResendUserTokenAsync(
                string email,
                UserTokenType tokenType,
                string frontendPath,
                Func<string, string, Task> sendEmail,
                CancellationToken cancellationToken = default)
        {
            email = email.Trim().ToLower();

            var user = await _userRepository.GetByEmail(email, cancellationToken);

            if (user == null || user.Status != UserStatus.PENDING)
                return;

            var lastToken = await _userTokenRepository
                .GetLatestToken(user.Id, tokenType, cancellationToken);

            if (lastToken != null)
            {
                var secondsSinceLast = (DateTime.UtcNow - lastToken.CreatedAt).TotalSeconds;

                if (secondsSinceLast < 60)
                    return;
            }

            await _userTokenRepository
                .RevokeTokens(user.Id, tokenType, cancellationToken);

            string rawToken = tokenType switch
            {
                UserTokenType.INVITATION =>
                    await _passwordCredentialService.CreateInvitationTokenAsync(user.Id, cancellationToken),

                UserTokenType.EMAIL_VERIFICATION =>
                    await _passwordCredentialService.CreateEmailVerificationTokenAsync(user.Id, cancellationToken),

                _ => throw new InvalidOperationException("Unsupported token type")
            };

            var link = $"{_frontendBaseUrl}/{frontendPath}?token={rawToken}";

            await sendEmail(user.Email, link);

            await _fileAuditService.LogAsync(
                action: $"Resend{tokenType}",
                performedBy: user.Email,
                details: $"{tokenType} token resent to {user.Email}"
            );
        }
        // Immediate Session Invalidation — JTI Blacklist  author: Anas
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

        // Immediate Session Invalidation — JTI Blacklist  author: Anas
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

        public async Task<LoginResponse> VerifyTwoFactorLogin(Guid userId, string code, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetById(userId, cancellationToken);

            if (user == null)
                throw new UnauthorizedAccessException();

            var valid = await _twoFactorService.VerifyCodeAsync(user, code);

            if (!valid)
            {
                var hash = TokenHelper.HashToken(code);

                var recovery = await _recoveryCodeRepository.GetValidCode(userId, hash);

                if (recovery == null)
                    throw new UnauthorizedAccessException("Invalid 2FA code");

                await _recoveryCodeRepository.MarkUsed(recovery);
            }

            return await CompleteLoginAsync(user, null, cancellationToken);
        }
    }
    }
