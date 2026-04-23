using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Services;
using user_service.Authorization;
using user_service.Filters;
using user_service.Infrastructure.Data;
using user_service.Infrastructure.Data.Seeding;
using user_service.Infrastructure.Repositories;
using user_service.Infrastructure.Auth;
using user_service.Infrastructure.Services;
using user_service.Middleware;

var builder = WebApplication.CreateBuilder(args);

#region SERVICES

builder.Services.AddSingleton<IEventPublisher, KafkaEventPublisher>();
builder.Services.AddScoped<IFileAuditService, FileAuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IPasswordCredentialService, PasswordCredentialService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IUserTokenRepository, UserTokenRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IMemberProfileRepository, MemberProfileRepository>();
builder.Services.AddScoped<ICoachProfileRepository, CoachProfileRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IGoogleAuthValidator, GoogleAuthValidator>();
builder.Services.AddScoped<IPasswordHasher, VersionedArgon2PasswordHasher>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<IRecoveryCodeRepository, RecoveryCodeRepository>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddScoped<AdminSeeder>();
builder.Services.AddScoped<IUsersService, UsersService>();

var presenceServiceUrl = Environment.GetEnvironmentVariable("PRESENCE_SERVICE_URL")
    ?? "http://presence-service:8080";

builder.Services.AddHttpClient<IPresenceClient, PresenceHttpClient>(client =>
{
    client.BaseAddress = new Uri(presenceServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(3); // presence check is non-critical — fail fast
});

// Immediate Session Invalidation — JTI Blacklist  author: Anas
builder.Services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();
builder.Services.AddHostedService<RevokedTokenCleanupService>();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddHttpContextAccessor();
#endregion

#region JWT CONFIGURATION

var privateKeyText = Environment.GetEnvironmentVariable("JWT_PRIVATE_KEY")!;
var publicKeyText = Environment.GetEnvironmentVariable("JWT_PUBLIC_KEY")!;
var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")!;

builder.Services.AddSingleton<ITokenService>(sp =>
{
    return new TokenService(privateKeyText, publicKeyText, issuer, audience);
});

builder.Services
.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    var rsa = RSA.Create();
    rsa.ImportFromPem(publicKeyText);

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = issuer,
        ValidAudience = audience,

        IssuerSigningKey = new RsaSecurityKey(rsa),

        // IMPORTANT FOR LOGOUT
        NameClaimType = JwtRegisteredClaimNames.Sub,
        RoleClaimType = "role"
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine("JWT AUTH FAILED:");
            Console.WriteLine(context.Exception);
            return Task.CompletedTask;
        },
        // Immediate Session Invalidation — JTI Blacklist  author: Anas
        OnTokenValidated = async context =>
        {
            var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

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

#endregion

#region AUTHORIZATION

builder.Services.AddCustomAuthorization();

#endregion

#region DATABASE

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(connectionString));

#endregion

#region SWAGGER

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

#endregion

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

#region DATABASE MIGRATION + SEEDER

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    db.Database.Migrate();

    var bootstrapEnabled = configuration.GetValue<bool>("BootstrapAdmin:Enabled");
    if (bootstrapEnabled)
    {
        var seeder = scope.ServiceProvider.GetRequiredService<AdminSeeder>();
        await seeder.SeedAsync(db, configuration);
    }
}

#endregion

app.Run();