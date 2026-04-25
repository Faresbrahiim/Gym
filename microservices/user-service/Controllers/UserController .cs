using Microsoft.AspNetCore.Authorization;
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

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDTO>>> GetUsers(CancellationToken cancellationToken)
        {
            // Extract the raw token so we can forward it to presence-service.
            // The token is already validated by the JWT middleware before we get here.
            var rawToken = HttpContext.Request.Headers.Authorization
                .FirstOrDefault()
                ?.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)
                ?? string.Empty;

            var users = await _usersService.GetUsers(rawToken, cancellationToken);

            return Ok(users);
        }

        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<ActionResult<PagedResponseDto<UserSearchResultDto>>> SearchUsers(
            [FromQuery] string q,
            CancellationToken cancellationToken,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(PagedResponseDto<UserSearchResultDto>.Create(Array.Empty<UserSearchResultDto>(), 1, pageSize, 0));

            var results = await _usersService.SearchUsersAsync(q, page, pageSize, cancellationToken);
            return Ok(results);
        }

        [Authorize]
        [HttpPost("contacts")]
        public async Task<ActionResult<IEnumerable<UserContactDto>>> GetContacts(
            [FromBody] UserContactLookupRequestDto request,
            CancellationToken cancellationToken)
        {
            if (request?.UserIds == null || request.UserIds.Count == 0)
                return Ok(Array.Empty<UserContactDto>());

            var contacts = await _usersService.GetContactsByIdsAsync(request.UserIds, cancellationToken);
            return Ok(contacts);
        }
    }
}
