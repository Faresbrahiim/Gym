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
                LastName = user.Profile?.LastName ?? "unkown",
                Username = user?.Username ?? "unkown",
                Email = user.Email,
                Role = user.Role,
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
    }

}