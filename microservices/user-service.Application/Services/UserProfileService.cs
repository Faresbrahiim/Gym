using Microsoft.AspNetCore.Http;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;
using user_service.Application.Domain.Exceptions;
using user_service.Application.DTOs;

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

            var result = new UserMeDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Role = user.Role.ToString(),

                Profile = user.Profile == null ? null : new UserProfileDto
                {
                    FirstName = user.Profile.FirstName,
                    LastName = user.Profile.LastName,
                    Phone = user.Profile.Phone,
                    ProfilePictureUrl = user.Profile.ProfilePictureUrl
                }
            };

            if (user.Role == UserRole.MEMBER && user.MemberProfile != null)
            {
                result.MemberProfile = new MemberProfileDto
                {
                    Gender = user.MemberProfile.Gender,
                    DateOfBirth = user.MemberProfile.DateOfBirth,
                    FitnessGoal = user.MemberProfile.FitnessGoal,
                    ExperienceLevel = (int?)user.MemberProfile.ExperienceLevel,
                    HeightCm = user.MemberProfile.HeightCm,
                    WeightKg = user.MemberProfile.WeightKg
                };
            }

            if (user.Role == UserRole.COACH && user.CoachProfile != null)
            {
                result.CoachProfile = new CoachProfileDto
                {
                    Language = user.CoachProfile.Language,
                    YearsOfExperience = user.CoachProfile.YearsOfExperience,
                    Bio = user.CoachProfile.Bio,
                    Certifications = user.CoachProfile.Certifications
                };
            }

            return result;
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

            var profile = await _userProfileRepository.GetByUserId(userId, cancellationToken)
                ?? throw new ProfileNotFoundException(userId);

            if (dto.FirstName != null) profile.FirstName = dto.FirstName;
            if (dto.LastName != null)  profile.LastName  = dto.LastName;
            if (dto.Phone != null)     profile.Phone     = dto.Phone;
            if (dto.ProfilePictureUrl != null) profile.ProfilePictureUrl = dto.ProfilePictureUrl;

            profile.UpdatedAt = DateTime.UtcNow;

            await _userProfileRepository.Update(profile, cancellationToken);
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
                await _memberProfileRepository.Create(new MemberProfile
                {
                    UserId        = userId,
                    Gender        = dto.Gender,
                    DateOfBirth   = dto.DateOfBirth.HasValue
                        ? DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc)
                        : null,
                    HeightCm      = dto.HeightCm,
                    WeightKg      = dto.WeightKg,
                    FitnessGoal   = dto.FitnessGoal,
                    ExperienceLevel = dto.ExperienceLevel.HasValue
                        ? (ExperienceLevel?)dto.ExperienceLevel.Value
                        : null,
                    CreatedAt = now,
                    UpdatedAt = now
                }, cancellationToken);
            }
            else
            {
                if (dto.Gender != null)         existing.Gender       = dto.Gender;
                if (dto.DateOfBirth.HasValue)   existing.DateOfBirth  = DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc);
                if (dto.HeightCm.HasValue)      existing.HeightCm     = dto.HeightCm;
                if (dto.WeightKg.HasValue)      existing.WeightKg     = dto.WeightKg;
                if (dto.FitnessGoal != null)    existing.FitnessGoal  = dto.FitnessGoal;
                if (dto.ExperienceLevel.HasValue)
                    existing.ExperienceLevel = (ExperienceLevel?)dto.ExperienceLevel.Value;

                existing.UpdatedAt = now;

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
                await _coachProfileRepository.Create(new CoachProfile
                {
                    UserId            = userId,
                    Bio               = dto.Bio,
                    YearsOfExperience = dto.YearsOfExperience,
                    Certifications    = dto.Certifications,
                    Language          = dto.Language ?? string.Empty,
                    CreatedAt         = now,
                    UpdatedAt         = now
                }, cancellationToken);
            }
            else
            {
                if (dto.Bio != null)                 existing.Bio               = dto.Bio;
                if (dto.YearsOfExperience.HasValue)  existing.YearsOfExperience = dto.YearsOfExperience;
                if (dto.Certifications != null)      existing.Certifications    = dto.Certifications;
                if (dto.Language != null)            existing.Language          = dto.Language;

                existing.UpdatedAt = now;

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

            var profile = await _userProfileRepository.GetByUserId(userId, cancellationToken)
                ?? throw new ProfileNotFoundException(userId);

            var url = await _fileStorageService.SaveAvatarAsync(file, userId, cancellationToken);

            profile.ProfilePictureUrl = url;
            profile.UpdatedAt = DateTime.UtcNow;

            await _userProfileRepository.Update(profile, cancellationToken);

            return url;
        }
    }
}
