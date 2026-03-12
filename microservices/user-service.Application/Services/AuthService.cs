using user_service.Application.DTOs;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Application.Mappers;
using user_service.Application.Domain.Exceptions;
using user_service.Helpers;

using static System.Runtime.InteropServices.JavaScript.JSType;
namespace user_service.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly IEmailService _emailService;
        private readonly IGoogleAuthValidator _googleAuthValidator;
        private readonly IFileAuditService _fileAuditService;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IPasswordCredentialService _passwordCredentialService;

        private readonly int _passwordResetExpiryMinutes;

        public AuthService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IUserProfileRepository userProfileRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IEmailService emailService,
            IGoogleAuthValidator googleAuthValidator,
            IRefreshTokenRepository refreshTokenRepository, 
            IFileAuditService fileAuditService
,
            IPasswordCredentialService passwordCredentialService
            )

        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _userProfileRepository = userProfileRepository;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _emailService = emailService;
            _googleAuthValidator = googleAuthValidator;
            _refreshTokenRepository = refreshTokenRepository;

            _passwordResetExpiryMinutes =
                int.TryParse(Environment.GetEnvironmentVariable("PASSWORD_RESET_TOKEN_EXPIRY_MINUTES"), out var minutes)
                ? minutes
                : 30;
            _fileAuditService = fileAuditService;
            _passwordCredentialService = passwordCredentialService;
        }

        // -----------------------------------------------------
        // LOGIN EMAIL (unchanged)
        // -----------------------------------------------------
        public async Task<LoginResponse> LoginWithEmail(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email.Trim().ToLower();
            var user = await _userRepository.GetByEmail(email, cancellationToken);

            if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash) || user.Status != UserStatus.ACTIVE)
                throw new UnauthorizedAccessException();
          
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
            }

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

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                Username = request.Username,
                PasswordHash = passwordHash,
                Role = UserRole.MEMBER,
                Status = UserStatus.ACTIVE,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var profile = new UserProfile
            {
                UserId = user.Id,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.Create(user, cancellationToken);
            await _userProfileRepository.Create(profile, cancellationToken);
            await _fileAuditService.LogAsync(
            action: "RegisterUser",
            performedBy: profile.User.Username,
            details: "User registered successfully"
            );
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

            var rawToken = TokenHelper.GenerateToken();
            var tokenHash = TokenHelper.HashToken(rawToken);

            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_passwordResetExpiryMinutes),
                CreatedAt = DateTime.UtcNow
            };

            await _passwordResetTokenRepository.Create(resetToken, cancellationToken);

            var resetLink = $"https://frontend-app/reset-password?token={rawToken}";
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
            bool updated = false;

            if (password != null && _passwordHasher.NeedsRehash(user.PasswordHash))
            {
                user.PasswordHash = _passwordHasher.Hash(password);
                updated = true;
            }

            user.LastLoginAt = DateTime.UtcNow;
            updated = true;

            if (updated)
                await _userRepository.Update(user, cancellationToken);

            var userDto = UserMapper.ToDto(user);
            var accessToken = _tokenService.GenerateToken(userDto);

            // ⭐ REAL refresh token
            var rawRefresh = TokenHelper.GenerateToken();
            var hash = TokenHelper.HashToken(rawRefresh);

            await _refreshTokenRepository.Create(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = hash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            }, cancellationToken);
            await _fileAuditService.LogAsync(
            action: "log in  ",
            performedBy: user.Username,
            details: "User logged successfully"
            );
            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = rawRefresh,
                User = userDto
            };
        }

        // -----------------------------------------------------
        // ⭐ REFRESH TOKEN
        // -----------------------------------------------------
        public async Task<LoginResponse> RefreshToken(string refreshToken, CancellationToken cancellationToken = default)
        {
            var hash = TokenHelper.HashToken(refreshToken);
            var stored = await _refreshTokenRepository.GetValidToken(hash, cancellationToken);

            if (stored == null)
                throw new UnauthorizedAccessException("Invalid refresh token");

            var user = await _userRepository.GetById(stored.UserId, cancellationToken)
                       ?? throw new UnauthorizedAccessException();

            // revoke old
            await _refreshTokenRepository.Revoke(stored, cancellationToken);

            // create new
            var newRaw = TokenHelper.GenerateToken();
            var newHash = TokenHelper.HashToken(newRaw);

            await _refreshTokenRepository.Create(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = newHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            }, cancellationToken);

            var userDto = UserMapper.ToDto(user);
            var newAccess = _tokenService.GenerateToken(userDto);

            return new LoginResponse
            {
                AccessToken = newAccess,
                RefreshToken = newRaw,
                User = userDto
            };
        }
        public async Task Logout(Guid userId)
        {
            await _fileAuditService.LogAsync(
           action: "log out  ",
           performedBy:  "get user name from db ",
           details: "User logged successfully"
           );
            // Revoke all refresh tokens for this user
            await _refreshTokenRepository.RevokeAllTokens(userId);
        }

    }
}