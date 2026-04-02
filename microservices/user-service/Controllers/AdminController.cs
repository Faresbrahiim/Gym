using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using user_service.Application.Authorization;
using user_service.Application.DTOs;
using user_service.Application.Interfaces;
using user_service.Authorization;

namespace user_service.Controllers
{
    [Route("api/admin/users")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [Authorize(Policy = Permissions.UsersCreate)]
        [HttpPost("member")]
        public async Task<IActionResult> CreateMember(
           [FromBody] CreateMemberByAdminDto dto,
           CancellationToken cancellationToken)
        {
            var performedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(performedBy))
                return Unauthorized();

            await _adminService.CreateMemberAsync(dto, performedBy, cancellationToken);

            return Ok(new { message = "Member invitation sent." });
        }

        [Authorize(Policy = Permissions.UsersCreate)]
        [HttpPost("coach")]
        public async Task<IActionResult> CreateCoach(
            [FromBody] CreateCoachByAdminDto dto,
            CancellationToken cancellationToken)


        {
            var performedBy = User.Identity?.Name;

            if (string.IsNullOrWhiteSpace(performedBy))
                return Unauthorized();

            await _adminService.CreateCoachAsync(dto, performedBy, cancellationToken);

            return Ok(new { message = "Coach invitation sent." });
        }

        [Authorize(Policy = Permissions.UsersManage)]
        [HttpPut("{userId}/role")]
        public async Task<IActionResult> ChangeUserRole(
    Guid userId,
    [FromBody] ChangeUserRoleRequest request,
    CancellationToken cancellationToken)
        {
            var performedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(performedBy))
                return Unauthorized();

            var result = await _adminService.ChangeUserRoleAsync(userId, request, performedBy, cancellationToken);

            return Ok(result);
        }

        [Authorize(Policy = Permissions.UsersManage)]
        [HttpPut("{userId}/status")]
        public async Task<IActionResult> ChangeUserStatus(
            Guid userId,
            [FromBody] ChangeUserStatusRequest request,
            CancellationToken cancellationToken)
        {
            var performedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(performedBy))
                return Unauthorized();

            var result = await _adminService.ChangeUserStatusAsync(userId, request, performedBy, cancellationToken);

            return Ok(result);
        }
    }
}
