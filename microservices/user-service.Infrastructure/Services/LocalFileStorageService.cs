using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LocalFileStorageService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
        {
            _env = env;
            _httpContextAccessor = httpContextAccessor;
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

            var request = _httpContextAccessor.HttpContext!.Request;
            return $"{request.Scheme}://{request.Host}/uploads/avatars/{fileName}";
        }
    }
}
