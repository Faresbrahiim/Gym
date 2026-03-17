using Microsoft.AspNetCore.Mvc;
using System.Threading;
using user_service.Application.DTOs;
using user_service.Application.Interfaces;
using user_service.Application.Services;
using user_service.Filters;
using user_service.Infrastructure.Repositories;

namespace user_service.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPasswordCredentialService _passwordCredentialService;
        private readonly IEmailService _emailService;

        public AuthController(IAuthService authService, IPasswordCredentialService passwordCredentialService, IEmailService emailService)
        {
            _authService = authService;
            _passwordCredentialService = passwordCredentialService;
            _emailService = emailService; ;

        }

        [HttpPost("register")]
        [Audit("RegisterUser")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var user = await _authService.RegisterAsync(request);

            return Ok(user);
        }

        [HttpPost("login/email")]
        [Audit("LoginWithEmail")]
        public async Task<IActionResult> LoginEmail([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var response = await _authService.LoginWithEmail(request);
            return Ok(response);
        }

        [HttpPost("login/google")]
        [Audit("LoginWithGoogle")]

        public async Task<IActionResult> LoginGoogle([FromBody] GoogleLoginRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var response = await _authService.LoginWithGoogle(request);
            return Ok(response);
        }

        [HttpPost("password/request-reset")]
        [Audit("reuest-user-password")]

        public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            await _authService.RequestPasswordReset(dto);
            return Ok(new { message = "If email exists, a reset link has been sent." });
        }

        [HttpPost("password/reset")]
        [Audit("reset-password")]

        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            await _authService.ResetPassword(dto);
            return Ok(new { message = "Password updated successfully." });
        }
        [HttpPost("logout")]
        [Audit("logout")]
        public async Task<IActionResult> Logout()
        {
            // Extract user ID from JWT claims
            var userIdClaim = User.FindFirst("sub")?.Value;  
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Invalid token" });

            // Call AuthService
            await _authService.Logout(userId);

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("accept-invitation")]
        public async Task<IActionResult> AcceptInvitation(
        [FromBody] AcceptInvitationDto dto,
        CancellationToken cancellationToken
        )
        {
            var user = await _passwordCredentialService.AcceptInvitationAsync(
                dto.Token,
                dto.Password,
                cancellationToken);

            return Ok(new { message = "Account activated successfully" });
        }

        [HttpPost("resend-invitation")]
        public async Task <IActionResult> resendinvitation([FromBody] ResendInvitationDto invitationDto ,CancellationToken cancellationToken)
        {
            await _authService.ResendInvitationAsync(invitationDto.email, cancellationToken);

            return Ok(new
            {
                message = "If the invitation exists, a new email has been sent."
            });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailDto dto,
        CancellationToken cancellationToken
            )
        {
            await _passwordCredentialService.VerifyEmailAsync(
                dto.Token,
                cancellationToken);

            return Ok(new
            {
                message = "Email verified successfully."
            });
        }
    }
}