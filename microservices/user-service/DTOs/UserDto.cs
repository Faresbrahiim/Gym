
namespace user_service.DTOs
{
    public class UserDto
    {
        public Guid Id { get; set; }

        public string Email { get; set; }

        public string Role { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }
    }
    // we can Add other user properties as needed
}
