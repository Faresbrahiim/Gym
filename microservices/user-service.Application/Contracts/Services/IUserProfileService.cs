using user_service.Application.DTOs;

namespace user_service.Application.Contracts.Services
{
    public interface IUserProfileService
    {
        Task<UserMeDto> GetMeAsync(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task UpdateMeAsync(
            Guid userId,
            UpdateUserProfileDto dto,
            CancellationToken cancellationToken = default);

        Task UpdateMemberProfileAsync(
            Guid userId,
            UpdateMemberProfileDto dto,
            CancellationToken cancellationToken = default);

        Task UpdateCoachProfileAsync(
            Guid userId,
            UpdateCoachProfileDto dto,
            CancellationToken cancellationToken = default);
    }
}
