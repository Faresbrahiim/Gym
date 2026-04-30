using Microsoft.Extensions.DependencyInjection;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Services;
using user_service.Infrastructure.Auth;
using user_service.Infrastructure.Repositories;
using user_service.Infrastructure.Services;

namespace user_service.Infrastructure.Extensions
{
    public static class InfrastructureServiceExtensions
    {
        public static IServiceCollection AddInfrastructureServices(
            this IServiceCollection services)
        {
            // External / Infra Services
            services.AddSingleton<IEventPublisher, KafkaEventPublisher>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            services.AddScoped<IPresenceClient, PresenceHttpClient>();

            // Repositories
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();

            // Security / Auth related
            services.AddScoped<ITwoFactorService, TwoFactorService>();
            services.AddScoped<IUserProfileService, UserProfileService>();

            return services;
        }
    }
}