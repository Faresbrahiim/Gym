using Microsoft.EntityFrameworkCore;
using user_service.Application.Interfaces;
using user_service.Authorization;
using user_service.Infrastructure.Data;
using user_service.Infrastructure.Data.Seeding;
using user_service.Infrastructure.Repositories;
using user_service.Infrastructure.Security;
using user_service.Interfaces;
using user_service.Middleware;
using user_service.Repositories;
using user_service.Services;

var builder = WebApplication.CreateBuilder(args);

// Servicess
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();


builder.Services.AddScoped<IPasswordHasher, VersionedArgon2PasswordHasher>();

// Token service (singleton with environment keys)
var privateKeyText = Environment.GetEnvironmentVariable("JWT_PRIVATE_KEY")!;
var publicKeyText = Environment.GetEnvironmentVariable("JWT_PUBLIC_KEY")!;
builder.Services.AddSingleton<ITokenService>(sp =>
{
    var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
    var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")!;
    return new TokenService(privateKeyText, publicKeyText, issuer, audience);
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(connectionString));

// Authorization
builder.Services.AddCustomAuthorization();

// Admin seeder
builder.Services.AddScoped<AdminSeeder>();

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global Exception Middleware 
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    Console.WriteLine("=== STARTING DATABASE MIGRATION ===");
    db.Database.Migrate();
    Console.WriteLine("=== DATABASE MIGRATION FINISHED ===");

    var bootstrapEnabled = configuration.GetValue<bool>("BootstrapAdmin:Enabled");
    if (bootstrapEnabled)
    {
        var seeder = scope.ServiceProvider.GetRequiredService<AdminSeeder>();
        await seeder.SeedAsync(db, configuration);
    }
}

app.Run();