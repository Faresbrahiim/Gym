using Microsoft.Extensions.DependencyInjection;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Infrastructure.Auth;
using user_service.Infrastructure.Repositories;
using user_service.Infrastructure.Services;

namespace user_service.API.Extensions
{
    public static class ApiServiceExtensions
    {
        public static IServiceCollection AddApiServices(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var presenceServiceUrl = Environment.GetEnvironmentVariable("PRESENCE_SERVICE_URL")
                ?? "http://presence-service:8080";

            services.AddHttpClient<IPresenceClient, PresenceHttpClient>(client =>
            {
                client.BaseAddress = new Uri(presenceServiceUrl);
                client.Timeout = TimeSpan.FromSeconds(3);
            });

            services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();
            services.AddHostedService<RevokedTokenCleanupService>();

            services.AddControllers();
            services.AddHealthChecks();
            services.AddHttpContextAccessor();

            return services;
        }
    }
}