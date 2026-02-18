using Microsoft.AspNetCore.Mvc;
using user_service.Interfaces;
using user_service.DTOs;
using user_service.Models;

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
                 return BadRequest(ModelState);
             }

            var response = _authService.LoginWithEmail(request);
             return Ok(response); 
        }

        [HttpPost("login/google")]
        public IActionResult LoginGoogle()
        {
            // will implement google login logic here later
            return Ok(Ok());
        }
     
    }
}