using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.DTOs
{
    public class CoachProfileDto
    {
        public string Language { get; set; } = null!;
        public int YearsOfExperience { get; set; }
        public string? Bio { get; set; }
    }
}
