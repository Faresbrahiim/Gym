using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Entities;

namespace user_service.Application.Interfaces
{
    public interface IPasswordCredentialService
    {
        Task<User> SetPasswordWithTokenAsync(string token, string newPassword, CancellationToken cancellationToken = default);
         Task<User> AcceptInvitationAsync(
    string rawToken,
    string password,
    CancellationToken cancellationToken = default);
    }
}
