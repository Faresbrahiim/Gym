using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Domain.Exceptions;
using user_service.Application.Entities;
using user_service.Application.Interfaces;
using user_service.Helpers;

namespace user_service.Application.Services
{
    public class PasswordCredentialService:IPasswordCredentialService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly IPasswordHasher _passwordHasher;

        public PasswordCredentialService(
            IUserRepository userRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _passwordHasher = passwordHasher;
        }

        public async Task<User> SetPasswordWithTokenAsync(string token, string newPassword, CancellationToken cancellationToken = default)
        {
            var tokenHash = TokenHelper.HashToken(token);

            var resetToken = await _passwordResetTokenRepository
                .GetValidToken(tokenHash, cancellationToken);

            if (resetToken == null)
                throw new InvalidTokenException();

            var user = await _userRepository
                .GetById(resetToken.UserId, cancellationToken);

            if (user == null)
                throw new UserNotFoundException(resetToken.UserId);

            user.PasswordHash = _passwordHasher.Hash(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            resetToken.UsedAt = DateTime.UtcNow;

            await _userRepository.Update(user, cancellationToken);
            await _passwordResetTokenRepository.Update(resetToken, cancellationToken);

            return user;
        }
    }
}
