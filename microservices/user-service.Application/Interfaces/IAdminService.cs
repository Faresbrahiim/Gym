using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.DTOs;

namespace user_service.Application.Interfaces
{
    public interface IAdminService
    {
        Task CreateMemberAsync(CreateMemberByAdminDto dto, string performedBy, CancellationToken cancellationToken = default);

        Task CreateCoachAsync(CreateCoachByAdminDto dto, string performedBy, CancellationToken cancellationToken = default);
    }
}
