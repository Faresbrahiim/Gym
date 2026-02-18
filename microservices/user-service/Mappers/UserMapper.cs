using user_service.DTOs;

namespace user_service.Services
{
    public static class UserMapper
    {
        // later when we have a User entity, we can create a method like this to map from User to UserDto
        public static UserDto ToDto(UserDto user)  // using UserDto for fake data
        {
            return new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }
    }
}
