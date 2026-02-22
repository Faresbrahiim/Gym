using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using user_service.Authorization;
using user_service.Data;
using user_service.Data.Seeding;
using user_service.Domain.Exceptions;
using user_service.Interfaces;
using user_service.Repositories;
using user_service.Security;
using user_service.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddControllers();
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

// Authorization (custom extension)
builder.Services.AddCustomAuthorization();
builder.Services.AddScoped<IPasswordHasher, Argon2PasswordHasher>();
builder.Services.AddScoped<AdminSeeder>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;

        context.Response.ContentType = "application/json";

        context.Response.StatusCode = exception switch
        {
            InvalidCredentialsException => StatusCodes.Status401Unauthorized,
            ExternalAuthException => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };

        await context.Response.WriteAsJsonAsync(new
        {
            error = exception?.Message ?? "Internal server error"
        });
    });
});




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

    // bootstrap seeding

    var bootstrapEnabled = configuration.GetValue<bool>("BootstrapAdmin:Enabled");

    if (bootstrapEnabled)
    {
        var seeder = scope.ServiceProvider.GetRequiredService<AdminSeeder>();
        await seeder.SeedAsync(db, configuration);
    }
}

app.Run();
