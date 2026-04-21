using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.DTOs;
using user_service.Application.Mappers;

public class UsersService : IUsersService
{
    private const int SearchMaxResults  = 20;
    private const int SearchMinQueryLen = 2;

    private readonly IUserRepository _userRepository;
    private readonly IPresenceClient _presenceClient;

    public UsersService(IUserRepository userRepository, IPresenceClient presenceClient)
    {
        _userRepository = userRepository;
        _presenceClient = presenceClient;
    }

    public async Task<IEnumerable<UserResponseDTO>> GetUsers(
        string adminBearerToken,
        CancellationToken cancellationToken = default)
    {
        var usersTask  = _userRepository.GetAllAsync(cancellationToken);
        var onlineTask = _presenceClient.GetOnlineUserIdsAsync(adminBearerToken, cancellationToken);

        await Task.WhenAll(usersTask, onlineTask);

        var onlineIds = onlineTask.Result;

        return usersTask.Result
            .Select(u =>
            {
                var dto = UserMapper.ToUserResponseDTO(u);
                dto.IsOnline = onlineIds.Contains(u.Id.ToString());
                return dto;
            })
            .ToList();
    }

    public async Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < SearchMinQueryLen)
            return [];

        var users = await _userRepository.SearchAsync(
            query.Trim(),
            SearchMaxResults,
            cancellationToken);

        return users.Select(UserMapper.ToSearchResultDto).ToList();
    }
}