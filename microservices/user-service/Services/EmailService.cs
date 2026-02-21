using user_service.Interfaces;

namespace user_service.Services
{
    public class EmailService : IEmailService
    {
        public async Task SendPasswordResetEmail(string toEmail, string resetLink)
        {
            Console.WriteLine($"Reset link sent to {toEmail}: {resetLink}");
            await Task.CompletedTask;
        }
    }
}