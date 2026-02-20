using user_service.DTOs;
using user_service.Interfaces;
using user_service.Mappers;
using user_service.Models;


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

            if (user == null)
                throw new Exception("Email not found");
            // todo : implement proper password hashing and verification
            if (user.PasswordHash != request.Password)
                throw new Exception("Invalid password");

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
            var refreshToken = "fake-refresh-token"; // TODO: implement real refresh token logic

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }

    }
}
