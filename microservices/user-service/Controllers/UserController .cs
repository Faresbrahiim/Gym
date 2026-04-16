using Microsoft.AspNetCore.Mvc;
using user_service.Application.DTOs;

namespace user_service.Controllers
{
    [Route("api/users")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUsersService _usersService;

        public UserController(IUsersService usersService)
        {
            _usersService = usersService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDTO>>> GetUsers(CancellationToken cancellationToken)
        {
            var users = await _usersService.GetUsers(cancellationToken);

            return Ok(users);
        }
    }
}