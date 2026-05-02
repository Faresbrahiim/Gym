using Microsoft.EntityFrameworkCore;                  
using user_service.Infrastructure.Data;
using user_service.Infrastructure.Data.Seeding;
using user_service.Application.Extensions;
using user_service.Authorization;
using user_service.Extensions;
using user_service.Infrastructure.Extensions;
using user_service.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

#region DEPENDENCY INJECTION

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);  
builder.Services.AddApiServices(builder.Configuration);

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCustomAuthorization();
builder.Services.AddDatabase(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

#endregion

var app = builder.Build();

#region MIDDLEWARE

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseApplicationMiddlewares();

app.MapControllers();
app.MapHealthChecks("/health");

#endregion

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