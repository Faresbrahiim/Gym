using user_service.Domain.Enums;
using user_service.DTOs;
using user_service.Interfaces;
using user_service.Mappers;
using user_service.Models;
using user_service.Repositories;
using user_service.Security;
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

        // ✅ Single constructor for all DI
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
        }

        // -----------------------------
        // LOGIN / REGISTER METHODS
        // -----------------------------

        public LoginResponse LoginWithEmail(LoginRequest request)
        {
            var user = _userRepository.GetByEmail(request.Email);

            if (user == null || user.PasswordHash != request.Password)
                throw new InvalidCredentialsException();

            if (user.Status != UserStatus.ACTIVE)
                throw new InvalidCredentialsException();

            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);

            var userDto = UserMapper.ToDto(user);
            var accessToken = _tokenService.GenerateToken(userDto);

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = "fake-refresh-token",
                User = userDto
            };
        }

        public LoginResponse LoginWithGoogle(GoogleLoginRequest request)
        {
            var payload = GoogleAuthValidator.ValidateIdToken(request.Token)
                ?? throw new ExternalAuthException("Invalid Google token");

            if (!payload.EmailVerified)
                throw new ExternalAuthException("Google email not verified");

            var externalLogin = _userRepository.GetExternalLogin("Google", payload.Subject);
            User user;

            if (externalLogin != null)
            {
                user = _userRepository.GetById(externalLogin.UserId);

                if (user.Status != UserStatus.ACTIVE)
                    throw new ExternalAuthException("User account is not active");
            }
            else
            {
                user = UserMapper.FromGooglePayload(payload);
                _userRepository.Create(user);

                var newExternalLogin = new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = "Google",
                    ProviderUserId = payload.Subject,
                    CreatedAt = DateTime.UtcNow
                };

                _userRepository.AddExternalLogin(newExternalLogin);

                if (user.Status != UserStatus.ACTIVE)
                    throw new ExternalAuthException("User account is not active");
            }

            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);

            var userDto = UserMapper.ToDto(user);
            var accessToken = _tokenService.GenerateToken(userDto);

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = "fake-refresh-token",
                User = userDto
            };
        }

        public async Task<UserDto> RegisterAsync(RegisterRequest request)
        {
            if (_userRepository.GetByEmail(request.Email) != null)
                throw new Exception("Email already exists");

            if (_userRepository.GetByUsername(request.Username) != null)
                throw new Exception("Username already exists");

            if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
                throw new Exception("Invalid role");

            var passwordHash = _passwordHasher.Hash(request.Password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                Username = request.Username,
                PasswordHash = passwordHash,
                Role = UserRole.MEMBER,
                Status = UserStatus.PENDING,
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

            _userRepository.Create(user);
            _userProfileRepository.Create(profile);

            return UserMapper.ToDto(user);
        }

        public void RequestPasswordReset(RequestPasswordResetDto dto)
        {
            var user = _userRepository.GetByEmail(dto.Email);
            if (user == null) return; // prevent user enumeration

            var rawToken = TokenHelper.GenerateToken();
            var tokenHash = TokenHelper.HashToken(rawToken);

            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                CreatedAt = DateTime.UtcNow
            };

            _passwordResetTokenRepository.Create(resetToken);

            var resetLink = $"https://frontend-app/reset-password?token={rawToken}";
            Console.WriteLine($"[DEBUG] Password reset link for {user.Email}: {resetLink}");

            try
            {
                _emailService.SendPasswordResetEmail(user.Email, resetLink);
            }
            catch (Exception ex)
            {
                throw new Exception("Failed to send password reset email", ex);
            }
        }

        public void ResetPassword(ResetPasswordDto dto)
        {
            var tokenHash = TokenHelper.HashToken(dto.Token);
            var resetToken = _passwordResetTokenRepository.GetValidToken(tokenHash);

            if (resetToken == null)
                throw new Exception("Invalid or expired reset token");

            var user = _userRepository.GetById(resetToken.UserId);

            if (user == null)
                throw new Exception("User not found");

            user.PasswordHash = dto.NewPassword;
            user.UpdatedAt = DateTime.UtcNow;

            resetToken.UsedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            _passwordResetTokenRepository.Update(resetToken);
        }
    }
}