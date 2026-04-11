using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using user_service.Application.Contracts.Services;

namespace user_service.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private static readonly HashSet<string> _allowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        private readonly IWebHostEnvironment _env;
        private readonly string _publicBaseUrl;

        public LocalFileStorageService(IWebHostEnvironment env, IConfiguration configuration)
        {
            _env = env;
            _publicBaseUrl = (configuration["PublicBaseUrl"] ?? "http://localhost:5000").TrimEnd('/');
        }

        public async Task<string> SaveAvatarAsync(IFormFile file, Guid userId, CancellationToken cancellationToken = default)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!_allowedExtensions.Contains(ext))
                throw new ArgumentException("Only image files are allowed (jpg, png, webp, gif).");

            var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", "avatars");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{userId}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream, cancellationToken);

            return $"{_publicBaseUrl}/uploads/avatars/{fileName}";
        }
    }
}
