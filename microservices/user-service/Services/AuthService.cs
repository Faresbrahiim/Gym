using user_service.DTOs;
using user_service.Interfaces;

namespace user_service.Services
{
    public class AuthService : IAuthService
    {
        // Fake users
        private readonly List<UserDto> _fakeUsers = new()
        {
            new UserDto { Id = 1, Name = "Ibrahim", Email = "ibrahim@test.com", Role = "USER" },
            new UserDto { Id = 2, Name = "Alice", Email = "alice@test.com", Role = "USER" }
        };

        public LoginResponse LoginWithEmail(LoginRequest request)
        {
            var user = _fakeUsers.FirstOrDefault(u => u.Email == request.Email);
            if (user == null)
                throw new Exception("Email not found");

            if (request.Password != "123456")
                throw new Exception("Invalid password");

            var userDto = UserMapper.ToDto(user);

            var accessToken = "fake-access-token";
            var refreshToken = "fake-refresh-token";

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }

        public LoginResponse LoginWithGoogle(GoogleLoginRequest request)
        {
            
            return new LoginResponse
            {};
        }
    }
}
