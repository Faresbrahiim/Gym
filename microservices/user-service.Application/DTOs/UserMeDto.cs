using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.DTOs
{
    public class UserMeDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Role { get; set; } = null!;

        public UserProfileDto? Profile { get; set; }
        public MemberProfileDto? MemberProfile { get; set; }
        public CoachProfileDto? CoachProfile { get; set; }
    }
}
