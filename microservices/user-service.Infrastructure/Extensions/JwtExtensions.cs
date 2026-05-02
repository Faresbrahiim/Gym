using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Infrastructure.Auth;

namespace user_service.Infrastructure.Extensions
{
    public static class JwtExtensions
    {
        public static IServiceCollection AddJwtAuthentication(
            this IServiceCollection services,
            IConfiguration config)
        {
            var privateKey = config["JWT_PRIVATE_KEY"];
            var publicKey = config["JWT_PUBLIC_KEY"];
            var issuer = config["JWT_ISSUER"];
            var audience = config["JWT_AUDIENCE"];

            // Token Service
            services.AddSingleton<ITokenService>(sp =>
                new TokenService(privateKey, publicKey, issuer, audience)
            );

            // Authentication
            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    var rsa = RSA.Create();
                    rsa.ImportFromPem(publicKey);

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,

                        ValidIssuer = issuer,
                        ValidAudience = audience,

                        IssuerSigningKey = new RsaSecurityKey(rsa),

                        NameClaimType = JwtRegisteredClaimNames.Sub,
                        RoleClaimType = "role"
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = async context =>
                        {
                            var jti = context.Principal?
                                .FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

                            if (!string.IsNullOrEmpty(jti))
                            {
                                var repo = context.HttpContext.RequestServices
                                    .GetRequiredService<IRevokedTokenRepository>();

                                if (await repo.IsRevoked(jti))
                                    context.Fail("Token has been revoked.");
                            }
                        }
                    };
                });

            return services;
        }
    }
}