namespace user_service.Application.Contracts.Services
{
    public interface IPresenceClient
    {
        // Returns the set of user IDs that are currently online.
        // Returns an empty set when presence-service is unreachable.
        Task<HashSet<string>> GetOnlineUserIdsAsync(string adminBearerToken, CancellationToken cancellationToken = default);
    }
}
