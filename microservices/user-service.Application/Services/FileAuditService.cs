
using System.Text;

using user_service.Application.Contracts.Services;

namespace user_service.Application.Services
{
    public class FileAuditService : IFileAuditService
    {
        private readonly string _logFolderPath = Path.Combine(AppContext.BaseDirectory, "Logs");
        private readonly string _logFilePath;

        public FileAuditService()
        {
            if (!Directory.Exists(_logFolderPath))
                Directory.CreateDirectory(_logFolderPath);

            _logFilePath = Path.Combine(_logFolderPath, "audit.log");
        }

        public async Task LogAsync(string action, string performedBy, string? details = null)
        {
            var logEntry = new StringBuilder();
            logEntry.Append($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] ");
            logEntry.Append($"Action: {action}; By: {performedBy}");
            if (!string.IsNullOrWhiteSpace(details))
                logEntry.Append($"; Details: {details}");
            logEntry.AppendLine();

            await File.AppendAllTextAsync(_logFilePath, logEntry.ToString());
        }
    }
}