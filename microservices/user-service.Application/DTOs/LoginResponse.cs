public class LoginResponse
{
    public bool RequiresTwoFactor { get; set; }

    public Guid? UserId { get; set; }

    public string? AccessToken { get; set; }

    public string? RefreshToken { get; set; }
}