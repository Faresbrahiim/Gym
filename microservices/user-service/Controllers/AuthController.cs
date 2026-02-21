using Microsoft.AspNetCore.Mvc;
using user_service.Interfaces;
using user_service.DTOs;

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

        // =========================
        // LOGIN EMAIL
        // =========================
        [HttpPost("login/email")]
        public IActionResult LoginEmail([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var response = _authService.LoginWithEmail(request);
            return Ok(response);
        }

        // =========================
        // LOGIN GOOGLE
        // =========================
        [HttpPost("login/google")]
        public IActionResult LoginGoogle([FromBody] GoogleLoginRequest request)
        {
            var response = _authService.LoginWithGoogle(request);
            return Ok(response);
        }

        // =========================
        // REQUEST PASSWORD RESET
        // =========================
        [HttpPost("password/request-reset")]
        public IActionResult RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            _authService.RequestPasswordReset(dto);

            // Always return generic message to prevent user enumeration
            return Ok(new { message = "If email exists, a reset link has been sent." });
        }

        // =========================
        // RESET PASSWORD
        // =========================
        [HttpPost("password/reset")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            try
            {
                _authService.ResetPassword(dto);
                return Ok(new { message = "Password updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}