using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Domain.Exceptions;
using user_service.Application.DTOs;
using user_service.Application.Entities;
using user_service.Application.Enums;
using user_service.Application.Interfaces;
using user_service.Helpers;

namespace user_service.Application.Services
{
    public class AdminService:IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserTokenRepository _userTokenRepository;
        private readonly IEmailService _emailService;
        private readonly IFileAuditService _fileAuditService;
        private readonly IPasswordCredentialService _passwordCredentialService;

        public AdminService(
          IUserRepository userRepository,
          IPasswordResetTokenRepository passwordResetTokenRepository,
          IEmailService emailService,
          IPasswordCredentialService passwordCredentialService,
          IUserTokenRepository userTokenRepository,
          IFileAuditService fileAuditService)
        {
            _userRepository = userRepository;
            _emailService = emailService;
            _fileAuditService = fileAuditService;
            _userTokenRepository = userTokenRepository;
            _passwordCredentialService = passwordCredentialService;
        }
        public async Task CreateMemberAsync(
            CreateMemberByAdminDto dto,
            string performedBy,
            CancellationToken cancellationToken = default)
        {
            await InviteUserAsync(
                    dto.Email,
                    dto.Username,
                    UserRole.MEMBER,
                    performedBy,
                    cancellationToken
             );

        }

        public async Task CreateCoachAsync(
            CreateCoachByAdminDto dto,
            string performedBy,
            CancellationToken cancellationToken = default)
        {
            await InviteUserAsync(
                   dto.Email,
                   dto.Username,
                   UserRole.COACH,
                   performedBy,
                   cancellationToken
               );
        }

        private async Task InviteUserAsync(
                string email,
                string username,
                UserRole role,
                string performedBy,
                CancellationToken cancellationToken)
        {
            email = email.Trim().ToLower();
            username = username.Trim();

            if (await _userRepository.GetByEmail(email, cancellationToken) != null)
                throw new EmailAlreadyExistsException(email);

            if (await _userRepository.GetByUsername(username, cancellationToken) != null)
                throw new UsernameAlreadyExistsException(username);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                Username = username,
                Role = role,
                Status = UserStatus.PENDING,
                PasswordHash = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.Create(user, cancellationToken);

            var rawToken = await _passwordCredentialService
                    .CreateInvitationTokenAsync(user.Id, cancellationToken);

            var invitationLink = $"https://frontend/setup-password?token={rawToken}";

            await _emailService.SendInvitationEmail(user.Email, invitationLink);

            await _fileAuditService.LogAsync(
                action: role == UserRole.MEMBER ? "AdminCreatedMember" : "AdminCreatedCoach",
                performedBy: performedBy,
                details: $"Admin invited {role} with email {user.Email}"
            );
        }
    }

}
