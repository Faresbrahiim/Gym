using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Domain.Exceptions;
using user_service.Application.DTOs;
using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Helpers;
using user_service.Application.Mappers;
using Microsoft.Extensions.Configuration;

namespace user_service.Application.Services
{
    public class AdminService:IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserTokenRepository _userTokenRepository;
        private readonly IEmailService _emailService;
        private readonly IFileAuditService _fileAuditService;
        private readonly IPasswordCredentialService _passwordCredentialService;
        private readonly string _frontendBaseUrl;

        public AdminService(
          IUserRepository userRepository,
          IEmailService emailService,
          IPasswordCredentialService passwordCredentialService,
          IUserTokenRepository userTokenRepository,
          IFileAuditService fileAuditService,
          IConfiguration configuration)
        {
            _userRepository = userRepository;
            _emailService = emailService;
            _fileAuditService = fileAuditService;
            _userTokenRepository = userTokenRepository;
            _passwordCredentialService = passwordCredentialService;
            _frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:4200";
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

            var user = UserMapper.FromInvitation(email, username, role);

            await _userRepository.Create(user, cancellationToken);

            var rawToken = await _passwordCredentialService
                    .CreateInvitationTokenAsync(user.Id, cancellationToken);

            var invitationLink = $"{_frontendBaseUrl}/setup-password?token={rawToken}";

            await _emailService.SendInvitationEmail(user.Email, invitationLink);

            await _fileAuditService.LogAsync(
                action: role == UserRole.MEMBER ? "AdminCreatedMember" : "AdminCreatedCoach",
                performedBy: performedBy,
                details: $"Admin invited {role} with email {user.Email}"
            );
        }
    }

}
