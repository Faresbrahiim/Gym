namespace user_service.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmail(string toEmail, string resetLink);
    }
}