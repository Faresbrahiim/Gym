using Microsoft.EntityFrameworkCore;
using user_service.Authorization;
using user_service.Data;
using user_service.Interfaces;
using user_service.Repositories;
using user_service.Services;
using user_service.Data.Seeding;
using user_service.Security;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddControllers();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSingleton<ITokenService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var privateKeyPath = config["Jwt:PrivateKeyPath"];
    var issuer = config["Jwt:Issuer"];
    var audience = config["Jwt:Audience"];
    return new TokenService(privateKeyPath, issuer, audience);
});

builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(connectionString));

// Authorization (custom extension)
builder.Services.AddCustomAuthorization();
builder.Services.AddScoped<IPasswordHasher, Argon2PasswordHasher>();
builder.Services.AddScoped<AdminSeeder>();


var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => "User Service Running");

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
