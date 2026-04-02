using user_service.Application.DTOs;

namespace user_service.Application.Interfaces
{
    public interface IAdminService
    {
        Task CreateMemberAsync(CreateMemberByAdminDto dto, string performedBy, CancellationToken cancellationToken = default);
        Task CreateCoachAsync(CreateCoachByAdminDto dto, string performedBy, CancellationToken cancellationToken = default);
        Task<UserDto> ChangeUserRoleAsync(Guid userId, ChangeUserRoleRequest request, string performedBy, CancellationToken cancellationToken = default);
        Task<UserDto> ChangeUserStatusAsync(Guid userId, ChangeUserStatusRequest request, string performedBy, CancellationToken cancellationToken = default);
    }
}