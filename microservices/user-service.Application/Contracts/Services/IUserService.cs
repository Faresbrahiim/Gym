using user_service.Application.DTOs;
public interface IUsersService
{
    Task<IEnumerable<UserResponseDTO>> GetUsers(CancellationToken cancellationToken = default);
}