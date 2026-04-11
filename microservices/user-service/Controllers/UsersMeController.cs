using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using user_service.Application.DTOs;
using user_service.Application.Contracts.Services;
using Microsoft.AspNetCore.Http;

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
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var userId = GetUserId();
            await _service.UpdateMeAsync(userId, dto, cancellationToken);
            return NoContent();
        }

        [HttpPut("member-profile")]
        public async Task<IActionResult> UpdateMemberProfile(
            [FromBody] UpdateMemberProfileDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var userId = GetUserId();
            await _service.UpdateMemberProfileAsync(userId, dto, cancellationToken);
            return NoContent();
        }

        [HttpPut("coach-profile")]
        public async Task<IActionResult> UpdateCoachProfile(
            [FromBody] UpdateCoachProfileDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var userId = GetUserId();
            await _service.UpdateCoachProfileAsync(userId, dto, cancellationToken);
            return NoContent();
        }

        [HttpPost("avatar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadAvatar(
            IFormFile file,
            CancellationToken cancellationToken)
        {
            var userId = GetUserId();
            var url = await _service.UploadAvatarAsync(userId, file, cancellationToken);
            return Ok(new { url });
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
