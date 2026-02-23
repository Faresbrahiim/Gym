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

        [HttpPost("login/email")]
        public IActionResult LoginEmail([FromBody] LoginRequest request)
        {
             if(!ModelState.IsValid)
             {
                return UnprocessableEntity(request);
             }

            var response = _authService.LoginWithEmail(request);
             return Ok(response); 
        }

        [HttpPost("login/google")]
        public IActionResult LoginGoogle([FromBody] GoogleLoginRequest request)
        {
            var response = _authService.LoginWithGoogle(request);
            return Ok(response);
        }

    }
}