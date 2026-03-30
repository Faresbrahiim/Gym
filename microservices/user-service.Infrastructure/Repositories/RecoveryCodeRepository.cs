using Microsoft.EntityFrameworkCore;
using user_service.Application.Domain.Entities;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Infrastructure.Data;

namespace user_service.Infrastructure.Repositories
{
    public class RecoveryCodeRepository : IRecoveryCodeRepository
    {
        private readonly UserDbContext _context;

        public RecoveryCodeRepository(UserDbContext context)
        {
            _context = context;
        }

        public async Task CreateMany(List<RecoveryCode> codes, CancellationToken cancellationToken = default)
        {
            await _context.RecoveryCodes.AddRangeAsync(codes, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<RecoveryCode?> GetValidCode(Guid userId, string codeHash, CancellationToken cancellationToken = default)
        {
            return await _context.RecoveryCodes
                .FirstOrDefaultAsync(
                    x => x.UserId == userId &&
                         x.CodeHash == codeHash &&
                         !x.Used,
                    cancellationToken);
        }

        public async Task MarkUsed(RecoveryCode code, CancellationToken cancellationToken = default)
        {
            code.Used = true;
            code.UsedAt = DateTime.UtcNow;

            _context.RecoveryCodes.Update(code);

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task InvalidateAll(Guid userId, CancellationToken cancellationToken = default)
        {
            var codes = await _context.RecoveryCodes
                .Where(x => x.UserId == userId && !x.Used)
                .ToListAsync(cancellationToken);

            foreach (var code in codes)
            {
                code.Used = true;
                code.UsedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}