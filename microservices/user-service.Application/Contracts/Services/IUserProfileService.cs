using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
    }
}
