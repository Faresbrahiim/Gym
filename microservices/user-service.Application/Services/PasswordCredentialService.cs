using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Domain.Exceptions;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Helpers;

namespace user_service.Application.Services
{
    public class PasswordCredentialService:IPasswordCredentialService
    {
        private readonly IUserRepository _userRepository;
        
        private readonly IUserTokenRepository _userTokenRepository;
        private readonly IPasswordHasher _passwordHasher;

        public PasswordCredentialService(
            IUserTokenRepository userTokenRepository,
            IUserRepository userRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _userTokenRepository = userTokenRepository;
        }

        public async Task<User> SetPasswordWithTokenAsync(string token, string newPassword, CancellationToken cancellationToken = default)
        {
            var tokenHash = TokenHelper.HashToken(token);

            var resetToken = await _userTokenRepository
                .GetValidToken(tokenHash, UserTokenType.PASSWORD_RESET, cancellationToken);

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
            await _userTokenRepository.Update(resetToken, cancellationToken);

            return user;
        }

        public async Task<User> AcceptInvitationAsync(
                    string rawToken,
                    string password,
                    CancellationToken cancellationToken = default
            )
        {
            var tokenHash = TokenHelper.HashToken(rawToken);

            var token = await _userTokenRepository.GetValidToken(
                tokenHash,
                UserTokenType.INVITATION,
                cancellationToken);

            if (token == null)
                throw new InvalidTokenException();

            var user = await _userRepository.GetById(token.UserId, cancellationToken);

            if (user == null)
                throw new UserNotFoundException(token.UserId);

            user.PasswordHash = _passwordHasher.Hash(password);
            user.Status = UserStatus.ACTIVE;
            user.UpdatedAt = DateTime.UtcNow;

            token.UsedAt = DateTime.UtcNow;

            await _userRepository.Update(user, cancellationToken);
            await _userTokenRepository.Update(token, cancellationToken);

            return user;
        }
    }
}
