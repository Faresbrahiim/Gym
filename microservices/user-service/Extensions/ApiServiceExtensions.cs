using Microsoft.Extensions.DependencyInjection;
using user_service.Infrastructure.Data.Seeding;

namespace user_service.API.Extensions;

public static class ApiServiceExtensions
{
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddControllers();
        services.AddHealthChecks();
        services.AddHttpContextAccessor();
        services.AddScoped<AdminSeeder>();

        return services;
    }
}