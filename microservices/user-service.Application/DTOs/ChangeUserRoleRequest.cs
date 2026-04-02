using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Enums;

namespace user_service.Application.DTOs
{
    public class ChangeUserRoleRequest
    {
        public UserRole Role { get; set; }

    }
}
