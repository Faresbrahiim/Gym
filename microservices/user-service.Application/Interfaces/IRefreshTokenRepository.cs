using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Entities;

namespace user_service.Application.Interfaces
{
    public interface IRefreshTokenRepository
    {
        void Create(RefreshToken token);
        RefreshToken? GetValidToken(string tokenHash);
        void Revoke(RefreshToken token);
        void RevokeAllTokens(Guid userId);

    }
}
