using user_service.DTOs;
using user_service.Interfaces;
using user_service.Mappers;
using user_service.Models;
using user_service.Domain.Exceptions;

namespace user_service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public AuthService(IUserRepository userRepository, ITokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        public LoginResponse LoginWithEmail(LoginRequest request)
        {
            var user = _userRepository.GetByEmail(request.Email);

            if (user == null || user.PasswordHash != request.Password)
                throw new InvalidCredentialsException();

            if (user.Status != Domain.Enums.UserStatus.ACTIVE)
                throw new InvalidCredentialsException();

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

                if (user.Status != Domain.Enums.UserStatus.ACTIVE)
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

                if (user.Status != Domain.Enums.UserStatus.ACTIVE)
                    throw new ExternalAuthException("User account is not active");
            }

            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);

            var userDto = UserMapper.ToDto(user);
            var accessToken = _tokenService.GenerateToken(userDto);
            var refreshToken = "fake-refresh-token";

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }
    }
}