using Microsoft.AspNetCore.Mvc;
using user_service.Application.DTOs;
using user_service.Application.Interfaces;
using user_service.Infrastructure.Repositories;

namespace user_service.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var user = await _authService.RegisterAsync(request);
            return Ok(user);
        }

        [HttpPost("login/email")]
        public async Task<IActionResult> LoginEmail([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var response = await _authService.LoginWithEmail(request);
            return Ok(response);
        }

        [HttpPost("login/google")]
        public async Task<IActionResult> LoginGoogle([FromBody] GoogleLoginRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var response = await _authService.LoginWithGoogle(request);
            return Ok(response);
        }

        [HttpPost("password/request-reset")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            await _authService.RequestPasswordReset(dto);
            return Ok(new { message = "If email exists, a reset link has been sent." });
        }

        [HttpPost("password/reset")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            await _authService.ResetPassword(dto);
            return Ok(new { message = "Password updated successfully." });
        }
        [HttpPost("logout")]
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
    }
}