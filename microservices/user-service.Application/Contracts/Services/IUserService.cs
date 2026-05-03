using user_service.Application.DTOs;

public interface IUsersService
{
    Task<IEnumerable<UserResponseDTO>> GetUsers(string adminBearerToken, CancellationToken cancellationToken = default);

    Task<PagedResponseDto<UserSearchResultDto>> SearchUsersAsync(
        string query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<UserContactDto>> GetContactsByIdsAsync(
        IEnumerable<string> userIds,
        CancellationToken cancellationToken = default);

    Task<UserSummaryDto> GetUserSummaryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AiUserProfileDto> GetAiUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}
