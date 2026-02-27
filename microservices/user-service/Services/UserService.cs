using user_service.Application.Common;
using user_service.Application.DTOs;
using user_service.Application.Enums;
using user_service.Application.Interfaces;

namespace user_service.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<PagedResult<UserListDto>> GetUsersForAdminAsync(
            int page,
            int pageSize,
            string? search,
            UserRole? role,
            UserStatus? status)
        {
            // Here you can add business rules later
            return await _userRepository.GetUsersForAdminAsync(
                page, pageSize, search, role, status);
        }
    }
}
