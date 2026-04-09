using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.DTOs
{
    public class VerifyEmailDto
    {
        public string Token { get; set; } = null!;
    }
}
