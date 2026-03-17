using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using user_service.Application.DTOs;
using user_service.Application.Interfaces;

namespace user_service.Controllers
{
    [ApiController]
    [Route("api/users/me")]
    [Authorize]
    public class UsersMeController : ControllerBase
    {
        private readonly IUserProfileService _service;

        public UsersMeController(IUserProfileService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
        {
            var userId = GetUserId();

            var result = await _service.GetMeAsync(userId, cancellationToken);

            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateMe(
            [FromBody] UpdateUserProfileDto dto,
            CancellationToken cancellationToken)
        {
            var userId = GetUserId();

            await _service.UpdateMeAsync(userId, dto, cancellationToken);

            return NoContent();
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("Invalid token");

            return Guid.Parse(userIdClaim);
        }
    }
}