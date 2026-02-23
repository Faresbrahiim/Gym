namespace user_service.Application.DTOs
{
    public class LoginResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public UserDto User { get; set; }
    }
}
