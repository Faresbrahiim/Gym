using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using user_service.Application.DTOs;

namespace user_service.Controllers
{
    [Route("internal/users")]
    [ApiController]
    public class InternalController : ControllerBase
    {
        private readonly IUsersService _usersService;

        public InternalController(IUsersService usersService)
        {
            _usersService = usersService;
        }

        [AllowAnonymous]
        [HttpGet("{userId:guid}/summary")]
        public async Task<ActionResult<UserSummaryDto>> GetUserSummary(
            Guid userId,
            CancellationToken cancellationToken)
        {
            var summary = await _usersService.GetUserSummaryAsync(userId, cancellationToken);
            return Ok(summary);
        }

        [AllowAnonymous]
        [HttpGet("{userId:guid}/ai-profile")]
        public async Task<ActionResult<AiUserProfileDto>> GetAiUserProfile(
            Guid userId,
            CancellationToken cancellationToken)
        {
            var profile = await _usersService.GetAiUserProfileAsync(userId, cancellationToken);
            return Ok(profile);
        }
    }
}
