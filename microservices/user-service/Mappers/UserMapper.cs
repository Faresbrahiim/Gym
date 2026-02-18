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
                Name = user.Profile != null
                    ? $"{user.Profile.FirstName} {user.Profile.LastName}"
                    : string.Empty,
                Email = user.Email,
                Role = ((UserRole)user.Role).ToString().ToUpper()
            };
        }
    }
}
