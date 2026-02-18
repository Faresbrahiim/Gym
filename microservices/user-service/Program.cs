using Microsoft.EntityFrameworkCore;
using user_service.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

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
