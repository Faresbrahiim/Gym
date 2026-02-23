using user_service.Domain.Enums;
using user_service.DTOs;
using user_service.Interfaces;
using user_service.Mappers;
using user_service.Models;
using user_service.Repositories;
using user_service.Security;


namespace user_service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUserProfileRepository _userProfileRepository;
        public AuthService(IUserRepository userRepository, ITokenService tokenService, IPasswordHasher passwordHasher , IUserProfileRepository userProfileRepository)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _userProfileRepository = userProfileRepository;
        }
        public LoginResponse LoginWithEmail(LoginRequest request)
        {
            var user = _userRepository.GetByEmail(request.Email);

            if (user == null)
                throw new Exception("Email not found");
            // todo : implement proper password hashing and verification
            // todo : use code status codes instead of exceptions for better API responses
            if (user.PasswordHash != request.Password)
                throw new Exception("Invalid password");
            if (user.Status != Domain.Enums.UserStatus.ACTIVE)
                throw new Exception("User account is not active");

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

                // ❌ Only allow login if user is ACTIVE
                if (user.Status != Domain.Enums.UserStatus.ACTIVE)
                    throw new UnauthorizedAccessException("User account is not active");
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

                // ❌ Only allow login if user is ACTIVE (optional: if you want new users to be ACTIVE by default)
                if (user.Status != Domain.Enums.UserStatus.ACTIVE)
                    throw new UnauthorizedAccessException("User account is not active");
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
        public async Task<UserDto> RegisterAsync(RegisterRequest request)
        {
            // 1️⃣ Vérifier email
            if (_userRepository.GetByEmail(request.Email) != null)
                throw new Exception("Email already exists");

            // 2️⃣ Vérifier username
            if (_userRepository.GetByUsername(request.Username) != null)
                throw new Exception("Username already exists");

            // 3️⃣ Convertir le rôle
            if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
                throw new Exception("Invalid role");

            // 4️⃣ Hasher le mot de passe
            var passwordHash = _passwordHasher.Hash(request.Password);

            // 5️⃣ Créer User
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                Username = request.Username,
                PasswordHash = passwordHash,
                Role = Domain.Enums.UserRole.MEMBER,
                Status = UserStatus.PENDING,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
                
            };

            // 6️⃣ Créer UserProfile
            var profile = new UserProfile
            {
                UserId = user.Id,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // 7️⃣ Sauvegarde (transaction recommandée)
            _userRepository.Create(user);
            _userProfileRepository.Create(profile);

            return UserMapper.ToDto(user);
        }
    }
}
