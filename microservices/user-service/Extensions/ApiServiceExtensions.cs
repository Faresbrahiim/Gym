using Microsoft.Extensions.DependencyInjection;
using user_service.Infrastructure.Data.Seeding;
using Microsoft.AspNetCore.ResponseCompression;  

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

        services.Configure<BrotliCompressionProviderOptions>(options =>
            options.Level = System.IO.Compression.CompressionLevel.Fastest);

        services.Configure<GzipCompressionProviderOptions>(options =>
            options.Level = System.IO.Compression.CompressionLevel.Fastest);
        return services;
    }
}