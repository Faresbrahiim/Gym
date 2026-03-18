using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using user_service.Application.Interfaces;
using user_service.Application.Loggings;
using user_service.Application.Services;
using user_service.Authorization;
using user_service.Filters;
using user_service.Infrastructure.Data;
using user_service.Infrastructure.Data.Seeding;
using user_service.Infrastructure.Repositories;
using user_service.Infrastructure.Security;
using user_service.Infrastructure.Services;
using user_service.Middleware;
using user_service.Repositories;

var builder = WebApplication.CreateBuilder(args);

#region SERVICES

builder.Services.AddScoped<IFileAuditService, FileAuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IPasswordCredentialService, PasswordCredentialService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IUserTokenRepository, UserTokenRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IGoogleAuthValidator, GoogleAuthValidator>();
builder.Services.AddScoped<IPasswordHasher, VersionedArgon2PasswordHasher>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<AdminSeeder>();
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

        // 🔥 IMPORTANT FOR LOGOUT
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
        OnTokenValidated = context =>
        {
            Console.WriteLine("JWT VALIDATED SUCCESSFULLY");
            return Task.CompletedTask;
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