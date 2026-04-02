using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using user_service.Application.Authorization;

namespace user_service.Authorization
{
    public static class AuthorizationExtensions
    {
        public static IServiceCollection AddCustomAuthorization(this IServiceCollection services)
        {
            services.AddAuthorization(options =>
            {
                RegisterPermissionPolicy(options, Permissions.UsersCreate);
                RegisterPermissionPolicy(options, Permissions.UsersActivate);
                RegisterPermissionPolicy(options, Permissions.UsersSuspend);
                RegisterPermissionPolicy(options, Permissions.UsersViewAll);
                RegisterPermissionPolicy(options, Permissions.MembersViewAssigned);
                RegisterPermissionPolicy(options, Permissions.UsersManage);
            });

            services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

            return services;
        }

        private static void RegisterPermissionPolicy(
            AuthorizationOptions options,
            string permission)
        {
            options.AddPolicy(permission,
                policy => policy.Requirements.Add(
                    new PermissionRequirement(permission)));
        }
    }
}
