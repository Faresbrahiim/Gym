using user_service.Application.DTOs;

public interface IUsersService
{
    Task<IEnumerable<UserResponseDTO>> GetUsers(string adminBearerToken, CancellationToken cancellationToken = default);

    Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(string query, CancellationToken cancellationToken = default);
}