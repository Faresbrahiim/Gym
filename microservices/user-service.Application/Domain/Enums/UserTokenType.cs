using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.Domain.Enums
{
    public enum UserTokenType
    {
        PASSWORD_RESET = 0,
        INVITATION = 1,
        EMAIL_VERIFICATION = 2
    }
}
