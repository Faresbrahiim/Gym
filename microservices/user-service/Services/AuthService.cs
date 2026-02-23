using user_service.Application.DTOs;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Application.Mappers;
using user_service.Domain.Exceptions;
using user_service.Helpers;
using user_service.Infrastructure.Repositories;
using user_service.Interfaces;
using user_service.Repositories;

namespace user_service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly IEmailService _emailService;
        private readonly IRefreshTokenRepository _refreshTokenRepository;


        public AuthService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IEmailService emailService,
            IRefreshTokenRepository refreshTokenRepository
            )
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _emailService = emailService;
            _refreshTokenRepository = refreshTokenRepository;
        }

        public LoginResponse LoginWithEmail(LoginRequest request)
        {
            var user = _userRepository.GetByEmail(request.Email);

            if (user == null)
                throw new InvalidCredentialsException();

            if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
                throw new InvalidCredentialsException();

            if (user.Status != UserStatus.ACTIVE)
                throw new InvalidCredentialsException();

            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);

            var userDto = UserMapper.ToDto(user);
            var accessToken = _tokenService.GenerateToken(userDto);

            // ? Create refresh token
            var rawRefreshToken = TokenHelper.GenerateToken();
            var refreshTokenHash = TokenHelper.HashToken(rawRefreshToken);

            _refreshTokenRepository.Create(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = refreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                UserAgent = null,
                IpAddress = null,
                //    UserAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"],
              //  IpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            });

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken, // send RAW to client
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
            }

            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);

            var userDto = UserMapper.ToDto(user);
            var accessToken = _tokenService.GenerateToken(userDto);

            //  Real refresh token
            var rawRefreshToken = TokenHelper.GenerateToken();
            var refreshTokenHash = TokenHelper.HashToken(rawRefreshToken);

            _refreshTokenRepository.Create(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = refreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken,
                User = userDto
            };
        }

        public void RequestPasswordReset(RequestPasswordResetDto dto)
        {
            var user = _userRepository.GetByEmail(dto.Email);

            // Prevent user enumeration
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

            user.PasswordHash = _passwordHasher.Hash(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            resetToken.UsedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            _passwordResetTokenRepository.Update(resetToken);
        }
        public LoginResponse RefreshToken(string refreshToken)
        {
            var hash = TokenHelper.HashToken(refreshToken);
            var stored = _refreshTokenRepository.GetValidToken(hash);

            if (stored == null)
                throw new UnauthorizedAccessException("Invalid or expired refresh token");

            var user = _userRepository.GetById(stored.UserId)
                       ?? throw new UnauthorizedAccessException();

            // Revoke old token
            _refreshTokenRepository.Revoke(stored);

            // Create new refresh token
            var newRaw = TokenHelper.GenerateToken();
            var newHash = TokenHelper.HashToken(newRaw);

            _refreshTokenRepository.Create(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = newHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });

            var userDto = UserMapper.ToDto(user);
            var newAccessToken = _tokenService.GenerateToken(userDto);

            return new LoginResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRaw,
                User = userDto
            };
        }
        public void Logout(Guid userId)
        {
            // Revoke all refresh tokens for this user
            _refreshTokenRepository.RevokeAllTokens(userId);
        }
    }
}