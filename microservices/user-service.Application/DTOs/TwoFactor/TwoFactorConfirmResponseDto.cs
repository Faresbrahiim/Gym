namespace user_service.Application.DTOs
{
    public class TwoFactorConfirmResponseDto
    {
        public List<string> RecoveryCodes { get; set; } = new();
    }
}