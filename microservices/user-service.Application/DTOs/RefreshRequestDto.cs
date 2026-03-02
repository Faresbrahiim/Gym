using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.DTOs
{
    public class RefreshRequestDto
    {
        public string RefreshToken { get; set; } = null!;
    }
}
