using user_service.DTOs;
using user_service.Interfaces;
using user_service.Mappers;
using user_service.Models;
using user_service.Helpers;

namespace user_service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly IEmailService _emailService;

        public AuthService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IEmailService emailService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _emailService = emailService;
        }

        // =========================
        // LOGIN WITH EMAIL
        // =========================
        public LoginResponse LoginWithEmail(LoginRequest request)
        {
            var user = _userRepository.GetByEmail(request.Email);

            if (user == null)
                throw new Exception("Email not found");

            // ⚠️ TODO: replace with BCrypt verification
            if (user.PasswordHash != request.Password)
                throw new Exception("Invalid password");

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

        // =========================
        // LOGIN WITH GOOGLE
        // =========================
        public LoginResponse LoginWithGoogle(GoogleLoginRequest request)
        {
            var payload = GoogleAuthValidator.ValidateIdToken(request.Token)
                ?? throw new UnauthorizedAccessException("Invalid Google token");

            if (!payload.EmailVerified)
                throw new UnauthorizedAccessException("Google email not verified");

            var externalLogin = _userRepository.GetExternalLogin("Google", payload.Subject);
            User user;

            if (externalLogin != null)
            {
                user = _userRepository.GetById(externalLogin.UserId);
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

        // =========================
        // REQUEST PASSWORD RESET
        // =========================
        public void RequestPasswordReset(RequestPasswordResetDto dto)
        {
            var user = _userRepository.GetByEmail(dto.Email);

            // 🔒 Prevent user enumeration
            if (user == null)
                return;

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
            _emailService.SendPasswordResetEmail(user.Email, resetLink);
        }

        // =========================
        // RESET PASSWORD
        // =========================
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