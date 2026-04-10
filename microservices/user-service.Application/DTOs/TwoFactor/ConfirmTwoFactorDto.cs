using System.ComponentModel.DataAnnotations;

public class ConfirmTwoFactorDto
{
    [Required]
    [RegularExpression(@"^\d{6,8}$")]
    public string Code { get; set; } = null!;
}