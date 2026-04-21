using Google.Apis.Auth;
using user_service.Application.Domain.Enums;
using user_service.Application.DTOs;
using user_service.Application.Domain.Entities;

namespace user_service.Application.Mappers
{
    public static class UserMapper
    {
        public static UserDto ToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                FirstName = user.Profile?.FirstName ?? "unknown",
                LastName = user.Profile?.LastName ?? "unknown",
                Username = user?.Username ?? "unknown",
                Email = user.Email,
                Role = user.Role,
            };
        }
        public static User FromRegisterRequest(string email, string username, string passwordHash)
        {
            var now = DateTime.UtcNow;
            return new User
            {
                Id           = Guid.NewGuid(),
                Email        = email,
                Username     = username,
                PasswordHash = passwordHash,
                Role         = UserRole.MEMBER,
                Status       = UserStatus.PENDING,
                CreatedAt    = now,
                UpdatedAt    = now
            };
        }

        public static User FromInvitation(string email, string username, UserRole role)
        {
            var now = DateTime.UtcNow;
            return new User
            {
                Id           = Guid.NewGuid(),
                Email        = email,
                Username     = username,
                Role         = role,
                Status       = UserStatus.PENDING,
                PasswordHash = null,
                CreatedAt    = now,
                UpdatedAt    = now
            };
        }

        // hadi dyal men google payload l user entity, ghadi t3tiha l auth service bach t create user jdida ila ma kaynach
        public static User FromGooglePayload(GoogleJsonWebSignature.Payload payload)
        {
            var now = DateTime.UtcNow;

            var user = new User
            {
                Email = payload.Email,
                Username = payload.Name, 
                PasswordHash = "",
                Role = UserRole.MEMBER,
                Status = UserStatus.ACTIVE,
                CreatedAt = now,
                UpdatedAt = now,
                LastLoginAt = now,

                Profile = new UserProfile
                {
                    FirstName = payload.GivenName ?? "unknown",
                    LastName = payload.FamilyName ?? "unknown",
                    ProfilePictureUrl = payload.Picture,
                    CreatedAt = now,
                    UpdatedAt = now
                }
            };

            return user;
        }
        public static UserResponseDTO ToUserResponseDTO(User user)
        {
            return new UserResponseDTO
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.Profile?.FirstName,
                LastName = user.Profile?.LastName,
                Role = user.Role.ToString()
            };
        }

        public static UserSearchResultDto ToSearchResultDto(User user)
        {
            return new UserSearchResultDto
            {
                Id        = user.Id,
                Username  = user.Username,
                FirstName = user.Profile?.FirstName ?? string.Empty,
                LastName  = user.Profile?.LastName  ?? string.Empty,
                Role      = user.Role.ToString(),
                AvatarUrl = user.Profile?.ProfilePictureUrl
            };
        }
    }

}