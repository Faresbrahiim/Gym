namespace user_service.Infrastructure.Logging;

public class AuditLogEntry
{
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Action { get; set; } = string.Empty; // e.g., "AddUser", "UpdateCoach"
    public string PerformedBy { get; set; } = string.Empty; // e.g., userId or username
    public string? Details { get; set; } // optional extra info
}