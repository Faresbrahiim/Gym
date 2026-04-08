// Immediate Session Invalidation — JTI Blacklist  author: Anas
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using user_service.Application.Contracts.Repositories;

namespace user_service.Infrastructure.Services
{
    public class RevokedTokenCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public RevokedTokenCleanupService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);

                using var scope = _scopeFactory.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IRevokedTokenRepository>();
                await repo.DeleteExpired(stoppingToken);
            }
        }
    }
}
