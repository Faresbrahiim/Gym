using user_service.DTOs;
using user_service.Interfaces;
using user_service.Mappers;


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

            var user = _userRepository.GetByEmail(payload.Email);

            if (user == null)
            {
                user = UserMapper.FromGooglePayload(payload);
                _userRepository.Create(user);
                //user = _userRepository.GetByEmail(payload.Email);
            }

            user.LastLoginAt = DateTime.UtcNow;
            _userRepository.Update(user);
          
            var userDto = UserMapper.ToDto(user);
           
            var accessToken = _tokenService.GenerateToken(userDto);
            var refreshToken = "fake-refresh-token"; //(nada)

            //todo : save refresh token in db  (nada)

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }


    }
}
