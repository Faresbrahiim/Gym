using Microsoft.AspNetCore.Mvc;
using user_service.Application.Interfaces;
using user_service.Application.DTOs;

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
            var user = await _authService.RegisterAsync(request);
            return Ok(user);
        }

        [HttpPost("login/email")]
        public IActionResult LoginEmail([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(request);

            var response = _authService.LoginWithEmail(request);
            return Ok(response);
        }

        [HttpPost("login/google")]
        public IActionResult LoginGoogle([FromBody] GoogleLoginRequest request)
        {
            var response = _authService.LoginWithGoogle(request);
            return Ok(response);
        }

  
        [HttpPost("password/request-reset")]
        public IActionResult RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);

            _authService.RequestPasswordReset(dto);

            // reason: prevent user enumeration
            return Ok(new { message = "If email exists, a reset link has been sent." });
        }

        [HttpPost("password/reset")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(dto);
                _authService.ResetPassword(dto);
                return Ok(new { message = "Password updated successfully." });
        }   
    }
}
