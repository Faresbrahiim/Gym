public class VerifyTwoFactorDto
{
    public Guid UserId { get; set; }

    public string Code { get; set; } = null!;
}