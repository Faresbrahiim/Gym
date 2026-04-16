using user_service.Application.Contracts.Repositories;
using user_service.Application.DTOs;
using user_service.Application.Mappers;


public class UsersService : IUsersService
{
    private readonly IUserRepository _userRepository;

    public UsersService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserResponseDTO>> GetUsers(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);

        return users
            .Select(UserMapper.ToUserResponseDTO)
            .ToList();
    }
}