using user_service.Interfaces;
using user_service.Repositories;
using user_service.Application.DTOs;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Application.Mappers;
using user_service.Domain.Exceptions;
using user_service.Helpers;

namespace user_service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly IEmailService _emailService;

        private readonly int _passwordResetExpiryMinutes;

        public AuthService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IUserProfileRepository userProfileRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IEmailService emailService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _userProfileRepository = userProfileRepository;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _emailService = emailService;

            // Read from environment variables
            _passwordResetExpiryMinutes = int.TryParse(Environment.GetEnvironmentVariable("PASSWORD_RESET_TOKEN_EXPIRY_MINUTES"), out var minutes)
                ? minutes
                : 30; // fallback to 30 minutes
        }

        // -----------------------------
        // LOGIN / REGISTER METHODS
        // -----------------------------

        public async Task<LoginResponse> LoginWithEmail(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email.Trim().ToLower();
            var user = await _userRepository.GetByEmail(email, cancellationToken);

            if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash) || user.Status != UserStatus.ACTIVE)
                throw new UnauthorizedAccessException();

            return await CompleteLoginAsync(user, request.Password, cancellationToken);
        }

        public async Task<LoginResponse> LoginWithGoogle(GoogleLoginRequest request, CancellationToken cancellationToken = default)
        {
            var payload = GoogleAuthValidator.ValidateIdToken(request.Token)
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

                var newExternalLogin = new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = "Google",
                    ProviderUserId = payload.Subject,
                    CreatedAt = DateTime.UtcNow
                };
                await _userRepository.AddExternalLogin(newExternalLogin, cancellationToken);

                if (user.Status != UserStatus.ACTIVE)
                    throw new ExternalAuthException("User account is not active");
            }

            return await CompleteLoginAsync(user, null, cancellationToken);
        }

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

            // Consider wrapping in a transaction in real implementation
            await _userRepository.Create(user, cancellationToken);
            await _userProfileRepository.Create(profile, cancellationToken);

            return UserMapper.ToDto(user);
        }

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

            // For now: comment sending email
            // await _emailService.SendPasswordResetEmail(user.Email, resetLink);
            // TODO: write reset link to log or text file
        }

        public async Task ResetPassword(ResetPasswordDto dto, CancellationToken cancellationToken = default)
        {
            var tokenHash = TokenHelper.HashToken(dto.Token);
            var resetToken = await _passwordResetTokenRepository.GetValidToken(tokenHash, cancellationToken);

            if (resetToken == null)
                throw new InvalidTokenException();

            var user = await _userRepository.GetById(resetToken.UserId, cancellationToken);
            if (user == null)
                throw new UserNotFoundException(resetToken.UserId);

            // Update only tracked fields
            user.PasswordHash = _passwordHasher.Hash(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            resetToken.UsedAt = DateTime.UtcNow;

            await _userRepository.Update(user, cancellationToken);
            await _passwordResetTokenRepository.Update(resetToken, cancellationToken);
        }
        // -----------------------------
        // Private Helper
        // -----------------------------

        private async Task<LoginResponse> CompleteLoginAsync(User user, string? password = null, CancellationToken cancellationToken = default)
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

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = "fake-refresh-token",
                User = userDto
            };
        }
    }
}