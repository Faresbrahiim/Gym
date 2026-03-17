using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.DTOs
{
    public class UpdateUserProfileDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? ProfilePictureUrl { get; set; }
    } 
}
