using Microsoft.EntityFrameworkCore;
using user_service.Authorization;
using user_service.Data;
using user_service.Data.Seeding;
using user_service.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

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
