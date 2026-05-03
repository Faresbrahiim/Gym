using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using user_service.Application.Contracts.Services;
using user_service.Application.Domain.Exceptions;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    private async Task SendMailAsync(MimeMessage email)
    {
        try
        {
            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(
                _config["Email:SmtpHost"],
                int.Parse(_config["Email:SmtpPort"]!),
                SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(
                _config["Email:SmtpUser"],
                _config["Email:SmtpPass"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            throw new EmailDeliveryException("Failed to send email. Please try again later.", ex);
        }
    }

    public async Task SendPasswordResetEmail(string toEmail, string resetLink)
    {
        var email = new MimeMessage();
        email.From.Add(MailboxAddress.Parse(_config["Email:SmtpUser"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = "Reset your password";

      email.Body = new TextPart("html")
{
    Text = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <title>Reset Password</title>
</head>
<body style='margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f6f8;'>

  <table width='100%' cellpadding='0' cellspacing='0'>
    <tr>
      <td align='center' style='padding:40px 0;'>
        <table width='600' style='background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:30px;'>

          <!-- LOGO -->
          <tr>
            <td align='center' style='font-size:28px; font-weight:bold; color:#0d6efd;'>
              🏋️ SMART GYM
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td style='padding-top:20px; font-size:22px; font-weight:bold; color:#333;'>
              Reset your password
            </td>
          </tr>

          <!-- MESSAGE -->
          <tr>
            <td style='padding-top:15px; font-size:16px; color:#555; line-height:1.5;'>
              You requested to reset your password. Click the button below to create a new one.
            </td>
          </tr>

          <!-- BUTTON -->
          <tr>
            <td align='center' style='padding:30px 0;'>
              <a href='{resetLink}' 
                 style='background:#0d6efd; color:white; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;'>
                 Reset Password
              </a>
            </td>
          </tr>

          <!-- WARNING -->
          <tr>
            <td style='font-size:14px; color:#777;'>
              If you did not request this, please ignore this email.  
              This link will expire in 15 minutes.
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style='padding-top:30px; font-size:12px; color:#aaa; text-align:center;'>
              © {DateTime.UtcNow.Year} SMART GYM • All rights reserved  
              <br/>Support: support@smartgym.com
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"
};

        await SendMailAsync(email);
    }

    public async Task SendInvitationEmail(string toEmail, string invitationLink)
    {
        var email = new MimeMessage();
        email.From.Add(MailboxAddress.Parse(_config["Email:SmtpUser"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = "You're invited to Smart Gym";

        email.Body = new TextPart("html")
        {
                Text = $@"
                    <!DOCTYPE html>
                    <html>
                    <body style='margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f6f8;'>

                    <table width='100%' cellpadding='0' cellspacing='0'>
                    <tr>
                    <td align='center' style='padding:40px 0;'>

                    <table width='600' style='background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.1);'>

                    <tr>
                    <td align='center' style='font-size:28px; font-weight:bold; color:#0d6efd;'>
                    🏋️ SMART GYM
                    </td>
                    </tr>

                    <tr>
                    <td style='padding-top:20px; font-size:22px; font-weight:bold; color:#333;'>
                    You've been invited!
                    </td>
                    </tr>

                    <tr>
                    <td style='padding-top:15px; font-size:16px; color:#555; line-height:1.6;'>
                    An administrator has created an account for you on <b>Smart Gym</b>.
                    <br><br>
                    To activate your account, please set your password using the button below.
                    </td>
                    </tr>

                    <tr>
                    <td align='center' style='padding:30px 0;'>
                    <a href='{invitationLink}' 
                    style='background:#0d6efd; color:white; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;'>
                    Activate Account
                    </a>
                    </td>
                    </tr>

                    <tr>
                    <td style='font-size:14px; color:#777;'>
                    This invitation link will expire in <b>30 minutes</b>.
                    If you did not expect this invitation, you can safely ignore this email.
                    </td>
                    </tr>

                    <tr>
                    <td style='padding-top:30px; font-size:12px; color:#aaa; text-align:center;'>
                    © {DateTime.UtcNow.Year} Smart Gym
                    <br/>
                    Support: support@smartgym.com
                    </td>
                    </tr>

                    </table>

                    </td>
                    </tr>
                    </table>

                    </body>
                    </html>"
        };

        await SendMailAsync(email);
    }

    public async Task SendEmailVerification(string toEmail, string verificationLink)
    {
        var email = new MimeMessage();
        email.From.Add(MailboxAddress.Parse(_config["Email:SmtpUser"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = "Verify your email";

        email.Body = new TextPart("html")
        {
            Text = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <title>Email Verification</title>
</head>
<body style='margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f6f8;'>

  <table width='100%' cellpadding='0' cellspacing='0'>
    <tr>
      <td align='center' style='padding:40px 0;'>
        <table width='600' style='background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:30px;'>

          <tr>
            <td align='center' style='font-size:28px; font-weight:bold; color:#0d6efd;'>
              🏋️ SMART GYM
            </td>
          </tr>

          <tr>
            <td style='padding-top:20px; font-size:22px; font-weight:bold; color:#333;'>
              Verify your email
            </td>
          </tr>

          <tr>
            <td style='padding-top:15px; font-size:16px; color:#555; line-height:1.5;'>
              Welcome to Smart Gym. Please confirm your email address by clicking the button below.
            </td>
          </tr>

          <tr>
            <td align='center' style='padding:30px 0;'>
              <a href='{verificationLink}' 
                 style='background:#0d6efd; color:white; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;'>
                 Verify Email
              </a>
            </td>
          </tr>

          <tr>
            <td style='font-size:14px; color:#777;'>
              If you did not create this account, please ignore this email.
            </td>
          </tr>

          <tr>
            <td style='padding-top:30px; font-size:12px; color:#aaa; text-align:center;'>
              © {DateTime.UtcNow.Year} SMART GYM
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"
        };

        await SendMailAsync(email);
    }
}