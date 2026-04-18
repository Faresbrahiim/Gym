
namespace user_service.Application.Contracts.Services
{
    public interface IFileAuditService
    {
        Task LogAsync(string action, string performedBy, string? details = null);
    }
}
