using System.ComponentModel.DataAnnotations;

public class VerifyTwoFactorDto
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [RegularExpression(@"^\d{6,8}$")]
    public string Code { get; set; } = null!;
}