using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using user_service.Application.Contracts.Services;

namespace user_service.Infrastructure.Services
{
    public class PresenceHttpClient : IPresenceClient
    {
        private readonly HttpClient _http;
        private readonly ILogger<PresenceHttpClient> _logger;

        public PresenceHttpClient(HttpClient http, ILogger<PresenceHttpClient> logger)
        {
            _http   = http;
            _logger = logger;
        }

        public async Task<HashSet<string>> GetOnlineUserIdsAsync(string adminBearerToken, CancellationToken cancellationToken = default)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, "/presence/online");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminBearerToken);

                var response = await _http.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Presence service returned {Status} for /presence/online", response.StatusCode);
                    return [];
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var doc  = JsonDocument.Parse(json);

                if (!doc.RootElement.TryGetProperty("online", out var arr) || arr.ValueKind != JsonValueKind.Array)
                    return [];

                var ids = new HashSet<string>(arr.GetArrayLength());
                foreach (var el in arr.EnumerateArray())
                {
                    var id = el.GetString();
                    if (!string.IsNullOrWhiteSpace(id)) ids.Add(id);
                }
                return ids;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to reach presence-service");
                return [];
            }
        }
    }
}
