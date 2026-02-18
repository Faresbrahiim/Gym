namespace user_service.DTOs
{
    public class LoginResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public UserDto User { get; set; }
    }
}
