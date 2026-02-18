using Microsoft.EntityFrameworkCore;
using user_service.Data;
using user_service.Interfaces;
using user_service.Repositories;
using user_service.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddControllers();

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


var app = builder.Build();

app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "User Service Running");

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();

Console.WriteLine("=== STARTING DATABASE MIGRATION ===");

db.Database.Migrate();

Console.WriteLine("=== DATABASE MIGRATION FINISHED ===");



app.Run();
