using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Domain.Exceptions;
using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;
using user_service.Application.Domain.Events;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Helpers;

namespace user_service.Application.Services
{
    public class PasswordCredentialService:IPasswordCredentialService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserTokenRepository _userTokenRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IEventPublisher _eventPublisher;

        public PasswordCredentialService(
            IUserTokenRepository userTokenRepository,
            IUserRepository userRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IPasswordHasher passwordHasher,
            IEventPublisher eventPublisher)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _userTokenRepository = userTokenRepository;
            _eventPublisher = eventPublisher;
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
            await ActivateUserAsync(user, token, cancellationToken);


            return user;
        }

        public async Task<string> CreateInvitationTokenAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
        {
            return await CreateTokenAsync(
            userId,
            UserTokenType.INVITATION,
            30,
            cancellationToken
            );
        }

        public async Task<string> CreatePasswordResetTokenAsync(
        Guid userId,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
        {
            return await CreateTokenAsync(
            userId,
            UserTokenType.PASSWORD_RESET,
            expiryMinutes,
            cancellationToken
            );
        }

        public async Task<string> CreateEmailVerificationTokenAsync(
            Guid userId,
            CancellationToken cancellationToken = default
            )
        {
            return await CreateTokenAsync(
                userId,
                UserTokenType.EMAIL_VERIFICATION,
                30,
                cancellationToken);
        }

        private async Task<string> CreateTokenAsync(
            Guid userId,
            UserTokenType type,
            int expiryMinutes,
            CancellationToken cancellationToken = default)
        {
            var rawToken = TokenHelper.GenerateToken();
            var tokenHash = TokenHelper.HashToken(rawToken);

            var token = new UserToken
            {
                UserId = userId,
                TokenHash = tokenHash,
                Type = type,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
            };

            await _userTokenRepository.Create(token, cancellationToken);

            return rawToken;
        }

        public async Task<User> VerifyEmailAsync(
        string rawToken,
        CancellationToken cancellationToken = default
            )
        {
            var tokenHash = TokenHelper.HashToken(rawToken);

            var token = await _userTokenRepository.GetValidToken(
                tokenHash,
                UserTokenType.EMAIL_VERIFICATION,
                cancellationToken);

            if (token == null)
                throw new InvalidTokenException();

            var user = await _userRepository.GetById(token.UserId, cancellationToken);

            if (user == null)
                throw new UserNotFoundException(token.UserId);
            await ActivateUserAsync(user, token, cancellationToken);

            return user;
        }

        private async Task ActivateUserAsync(
            User user,
            UserToken token,
            CancellationToken cancellationToken
            )
        {
            user.Status = UserStatus.ACTIVE;
            user.UpdatedAt = DateTime.UtcNow;

            token.UsedAt = DateTime.UtcNow;

            await _userRepository.Update(user, cancellationToken);
            await _userTokenRepository.Update(token, cancellationToken);

            await _eventPublisher.PublishAsync(
                "auth.user.activated",
                new UserActivatedEvent { UserId = user.Id, Email = user.Email, Role = user.Role.ToString() },
                cancellationToken);
        }
    }
}
