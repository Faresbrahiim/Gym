using user_service.Application.Enums;

namespace user_service.Application.DTOs
{
    public class ChangeUserStatusRequest
    {
        public UserStatus Status { get; set; }
    }
}