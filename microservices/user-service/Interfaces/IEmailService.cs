namespace user_service.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmail(string toEmail, string resetLink);
    }
}