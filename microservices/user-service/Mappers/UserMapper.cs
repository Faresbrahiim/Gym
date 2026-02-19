using Google.Apis.Auth;
using user_service.Domain.Enums;
using user_service.DTOs;
using user_service.Models;

namespace user_service.Mappers
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

                Email = user.Email,
                Role = ((UserRole)user.Role).ToString().ToUpper()
            };
        }
        // hadi dyal men google payload l user entity, ghadi t3tiha l auth service bach t create user jdida ila ma kaynach
        public static User FromGooglePayload(GoogleJsonWebSignature.Payload payload)
        {
            var now = DateTime.UtcNow;

            var user = new User
            {
                Email = payload.Email,
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