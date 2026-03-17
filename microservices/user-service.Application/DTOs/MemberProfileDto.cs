using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace user_service.Application.DTOs
{
    public class MemberProfileDto
    {
        public string? Gender { get; set; }
        public string? FitnessGoal { get; set; }
        public int? ExperienceLevel { get; set; }
        public double? HeightCm { get; set; }
        public double? WeightKg { get; set; }
    }
}
