namespace user_service.Models
{
    public class CoachAvailability
    {
        public Guid Id { get; set; }

        public Guid CoachId { get; set; }

        public int DayOfWeek { get; set; }

        public TimeOnly StartTime { get; set; }

        public TimeOnly EndTime { get; set; }

        public DateTime CreatedAt { get; set; }

        // Navigation
        public User Coach { get; set; } = null!;
    }
}
