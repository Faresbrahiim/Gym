using Microsoft.AspNetCore.Http;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Domain.Enums;
using user_service.Application.Domain.Exceptions;
using user_service.Application.DTOs;
using user_service.Application.Mappers;

namespace user_service.Application.Services
{
    public class UserProfileService : IUserProfileService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IMemberProfileRepository _memberProfileRepository;
        private readonly ICoachProfileRepository _coachProfileRepository;
        private readonly IFileStorageService _fileStorageService;

        public UserProfileService(
            IUserRepository userRepository,
            IUserProfileRepository userProfileRepository,
            IMemberProfileRepository memberProfileRepository,
            ICoachProfileRepository coachProfileRepository,
            IFileStorageService fileStorageService)
        {
            _userRepository = userRepository;
            _userProfileRepository = userProfileRepository;
            _memberProfileRepository = memberProfileRepository;
            _coachProfileRepository = coachProfileRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<UserMeDto> GetMeAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetFullById(userId, cancellationToken)
                ?? throw new UserNotFoundException(userId);

            if (user.Status != UserStatus.ACTIVE)
                throw new AccountNotActivatedException();

            return ProfileMapper.ToUserMeDto(user);
        }

        public async Task UpdateMeAsync(
            Guid userId,
            UpdateUserProfileDto dto,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetById(userId, cancellationToken)
                ?? throw new UserNotFoundException(userId);

            if (user.Status != UserStatus.ACTIVE)
                throw new AccountNotActivatedException();

            var now = DateTime.UtcNow;
            var profile = await _userProfileRepository.GetByUserId(userId, cancellationToken);

            if (profile == null)
            {
                await _userProfileRepository.Create(ProfileMapper.NewUserProfile(userId, dto, now), cancellationToken);
            }
            else
            {
                ProfileMapper.ApplyUpdate(profile, dto, now);
                await _userProfileRepository.Update(profile, cancellationToken);
            }
        }

        public async Task UpdateMemberProfileAsync(
            Guid userId,
            UpdateMemberProfileDto dto,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetById(userId, cancellationToken)
                ?? throw new UserNotFoundException(userId);

            if (user.Status != UserStatus.ACTIVE)
                throw new AccountNotActivatedException();

            if (user.Role != UserRole.MEMBER)
                throw new UnauthorizedAccessException("Only members can update member profiles.");

            var now = DateTime.UtcNow;
            var existing = await _memberProfileRepository.GetByUserId(userId, cancellationToken);

            if (existing == null)
            {
                await _memberProfileRepository.Create(ProfileMapper.NewMemberProfile(userId, dto, now), cancellationToken);
            }
            else
            {
                ProfileMapper.ApplyUpdate(existing, dto, now);
                await _memberProfileRepository.Update(existing, cancellationToken);
            }
        }

        public async Task UpdateCoachProfileAsync(
            Guid userId,
            UpdateCoachProfileDto dto,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetById(userId, cancellationToken)
                ?? throw new UserNotFoundException(userId);

            if (user.Status != UserStatus.ACTIVE)
                throw new AccountNotActivatedException();

            if (user.Role != UserRole.COACH)
                throw new UnauthorizedAccessException("Only coaches can update coach profiles.");

            var now = DateTime.UtcNow;
            var existing = await _coachProfileRepository.GetByUserId(userId, cancellationToken);

            if (existing == null)
            {
                await _coachProfileRepository.Create(ProfileMapper.NewCoachProfile(userId, dto, now), cancellationToken);
            }
            else
            {
                ProfileMapper.ApplyUpdate(existing, dto, now);
                await _coachProfileRepository.Update(existing, cancellationToken);
            }
        }

        public async Task<string> UploadAvatarAsync(
            Guid userId,
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetById(userId, cancellationToken)
                ?? throw new UserNotFoundException(userId);

            if (user.Status != UserStatus.ACTIVE)
                throw new AccountNotActivatedException();

            var now = DateTime.UtcNow;
            var profile = await _userProfileRepository.GetByUserId(userId, cancellationToken);
            var url = await _fileStorageService.SaveAvatarAsync(file, userId, cancellationToken);

            if (profile == null)
            {
                await _userProfileRepository.Create(
                    ProfileMapper.NewUserProfile(userId, string.Empty, string.Empty, now, url),
                    cancellationToken);
            }
            else
            {
                profile.ProfilePictureUrl = url;
                profile.UpdatedAt = now;

                await _userProfileRepository.Update(profile, cancellationToken);
            }

            return url;
        }
    }
}
