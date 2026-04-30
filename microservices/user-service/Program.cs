#region IMPORTS

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;

using user_service.API.Extensions;
using user_service.Application.Extensions;
using user_service.Authorization;
using user_service.Extensions;
using user_service.Infrastructure.Extensions;

#endregion

var builder = WebApplication.CreateBuilder(args);

#region DEPENDENCY INJECTION

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();
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

app.Run();