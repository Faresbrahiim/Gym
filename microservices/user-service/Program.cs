using user_service.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddControllers();

var app = builder.Build();

app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "User Service Running");

app.Run();
