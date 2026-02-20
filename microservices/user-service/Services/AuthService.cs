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
            // 1️⃣ Validate the Google token
            var payload = GoogleAuthValidator.ValidateIdToken(request.Token)
                ?? throw new UnauthorizedAccessException("Invalid Google token");

            if (!payload.EmailVerified)
                throw new UnauthorizedAccessException("Google email not verified");

            // 2️⃣ Check if this Google account is already linked in external_logins
            var externalLogin = _userRepository.GetExternalLogin("Google", payload.Subject);

            User user;

            if (externalLogin != null)
            {
                // 3️⃣ Existing Google login -> fetch the linked user
                user = _userRepository.GetById(externalLogin.UserId);
            }
            else
            {
                // 4️⃣ New Google login -> create user + profile
                user = UserMapper.FromGooglePayload(payload);
                _userRepository.Create(user);

                // 5️⃣ Create the external login record
                var newExternalLogin = new ExternalLogin
                {
                    UserId = user.Id,
                    Provider = "Google",
                    ProviderUserId = payload.Subject,
                    CreatedAt = DateTime.UtcNow
                };
                _userRepository.AddExternalLogin(newExternalLogin);
            }

            // 6️⃣ Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);

            // 7️⃣ Prepare DTO and generate JWT token
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
