using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using user_service.Application.Enums;
using user_service.Application.Interfaces;

namespace user_service.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;

        public AdminController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
        int page = 1,
        int pageSize = 10,
        string? search = null,
        UserRole? role = null,
        UserStatus? status = null)
        {
            var result = await _userService.GetUsersForAdminAsync(
                page,
                pageSize,
                search,
                role,
                status);

            return Ok(result);
        }
    }
}
