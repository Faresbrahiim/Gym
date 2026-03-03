using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.Interfaces
{
    public interface IFileAuditService
    {
        Task LogAsync(string action, string performedBy, string? details = null);
    }
}
