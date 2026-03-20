using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Entities;

namespace user_service.Application.Interfaces
{
    public interface ITwoFactorService
    {
        Task<TwoFactorSetupDto> GenerateSetupAsync(Guid userId);
        Task ConfirmSetupAsync(Guid userId, string code);

        //Task<bool> VerifyTwoFactorCodeAsync(Guid userId, string code);

        Task<bool> VerifyCodeAsync(User user, string code);
    }
}
