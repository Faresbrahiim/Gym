using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Common;
using user_service.Application.DTOs;
using user_service.Application.Enums;

namespace user_service.Application.Interfaces
{
    public interface IUserService
    {
        Task<PagedResult<UserListDto>> GetUsersForAdminAsync(
            int page,
            int pageSize,
            string? search,
            UserRole? role,
            UserStatus? status);
    }
}
