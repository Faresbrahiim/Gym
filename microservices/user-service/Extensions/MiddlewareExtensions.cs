using Microsoft.Extensions.FileProviders;
using user_service.Middleware;

namespace user_service.Extensions
{
    public static class MiddlewareExtensions
    {
        public static WebApplication UseApplicationMiddlewares(this WebApplication app)
        {
            app.UseResponseCompression(); 

            app.UseMiddleware<GlobalExceptionMiddleware>();

            var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
            Directory.CreateDirectory(uploadsPath);

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(uploadsPath),
                RequestPath = "/uploads"
            });

            app.UseAuthentication();
            app.UseAuthorization();

            return app;
        }
    }
}
