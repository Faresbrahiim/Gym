namespace user_service.Application.Contracts.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmail(string toEmail, string resetLink);
        Task SendInvitationEmail(string email, string invitationLink);

        Task SendEmailVerification(string email, string link);
    }
}