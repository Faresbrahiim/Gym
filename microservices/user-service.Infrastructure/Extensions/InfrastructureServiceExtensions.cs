using Microsoft.Extensions.Configuration;  // ← ADD THIS
using Microsoft.Extensions.DependencyInjection;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Infrastructure.Auth;
using user_service.Infrastructure.Repositories;
using user_service.Infrastructure.Services;

namespace user_service.Infrastructure.Extensions;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)   
    {
        // Repositories
        services.AddScoped<IUserRepository,            UserRepository>();
        services.AddScoped<IRefreshTokenRepository,    RefreshTokenRepository>();
        services.AddScoped<IUserTokenRepository,       UserTokenRepository>();
        services.AddScoped<IUserProfileRepository,     UserProfileRepository>();
        services.AddScoped<IMemberProfileRepository,   MemberProfileRepository>();
        services.AddScoped<ICoachProfileRepository,    CoachProfileRepository>();
        services.AddScoped<IRecoveryCodeRepository,    RecoveryCodeRepository>();
        services.AddScoped<IRevokedTokenRepository,    RevokedTokenRepository>();

        // Security
        services.AddScoped<IPasswordHasher, VersionedArgon2PasswordHasher>();

        // Infrastructure Services
        services.AddSingleton<IEventPublisher,  KafkaEventPublisher>();
        services.AddScoped<IEmailService,       EmailService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<ITwoFactorService,   TwoFactorService>();
        services.AddScoped<IUsersService,       UsersService>();

        // Presence HTTP Client
        var presenceServiceUrl =
            Environment.GetEnvironmentVariable("PRESENCE_SERVICE_URL")
            ?? "http://presence-service:8080";

        services.AddHttpClient<IPresenceClient, PresenceHttpClient>(client =>
        {
            client.BaseAddress = new Uri(presenceServiceUrl);
            client.Timeout     = TimeSpan.FromSeconds(3);
        });

        // Background Services
        services.AddHostedService<RevokedTokenCleanupService>();

        return services;
    }
}