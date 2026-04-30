using Microsoft.Extensions.DependencyInjection;
using user_service.Application.Contracts.Services;
using user_service.Application.Services;

namespace user_service.Application.Extensions
{
    public static class ApplicationServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(
            this IServiceCollection services)
        {
            // Application Services
            services.AddScoped<IAdminService, AdminService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IFileAuditService, FileAuditService>();
            services.AddScoped<IGoogleAuthValidator, GoogleAuthValidator>();
            services.AddScoped<IPasswordCredentialService, PasswordCredentialService>();
            services.AddScoped<IUserProfileService, UserProfileService>();

            return services;
        }
    }
}