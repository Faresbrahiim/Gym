using user_service.Application.Domain.Entities;
using user_service.Application.Domain.Enums;
using user_service.Application.DTOs;

namespace user_service.Application.Mappers
{
    public static class ProfileMapper
    {
        //                               read || entity --> dto

        public static UserMeDto ToUserMeDto(User user)
        {
            var dto = new UserMeDto
            {
                Id       = user.Id,
                Email    = user.Email,
                Username = user.Username,
                Role     = user.Role.ToString(),
                Profile  = user.Profile == null ? null : ToUserProfileDto(user.Profile)
            };

            if (user.Role == UserRole.MEMBER && user.MemberProfile != null)
                dto.MemberProfile = ToMemberProfileDto(user.MemberProfile);

            if (user.Role == UserRole.COACH && user.CoachProfile != null)
                dto.CoachProfile = ToCoachProfileDto(user.CoachProfile);

            return dto;
        }

        public static UserProfileDto ToUserProfileDto(UserProfile profile) => new()
        {
            FirstName         = profile.FirstName,
            LastName          = profile.LastName,
            Phone             = profile.Phone,
            ProfilePictureUrl = profile.ProfilePictureUrl
        };

        public static MemberProfileDto ToMemberProfileDto(MemberProfile profile) => new()
        {
            Gender          = profile.Gender,
            DateOfBirth     = profile.DateOfBirth,
            FitnessGoal     = profile.FitnessGoal,
            ExperienceLevel = (int?)profile.ExperienceLevel,
            HeightCm        = profile.HeightCm,
            WeightKg        = profile.WeightKg
        };

        public static CoachProfileDto ToCoachProfileDto(CoachProfile profile) => new()
        {
            Bio               = profile.Bio,
            YearsOfExperience = profile.YearsOfExperience,
            Certifications    = profile.Certifications,
            Language          = profile.Language
        };

        //                                Create dto -- > new entity

        public static UserProfile NewUserProfile(Guid userId, UpdateUserProfileDto dto, DateTime now) => new()
        {
            UserId            = userId,
            FirstName         = dto.FirstName ?? string.Empty,
            LastName          = dto.LastName  ?? string.Empty,
            Phone             = dto.Phone,
            ProfilePictureUrl = dto.ProfilePictureUrl,
            CreatedAt         = now,
            UpdatedAt         = now
        };

        public static UserProfile NewUserProfile(
            Guid userId,
            string firstName,
            string lastName,
            DateTime now,
            string? profilePictureUrl = null) => new()
        {
            UserId            = userId,
            FirstName         = firstName,
            LastName          = lastName,
            ProfilePictureUrl = profilePictureUrl,
            CreatedAt         = now,
            UpdatedAt         = now
        };

        public static MemberProfile NewMemberProfile(Guid userId, UpdateMemberProfileDto dto, DateTime now) => new()
        {
            UserId          = userId,
            Gender          = dto.Gender,
            DateOfBirth     = dto.DateOfBirth.HasValue
                ? DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc)
                : null,
            HeightCm        = dto.HeightCm,
            WeightKg        = dto.WeightKg,
            FitnessGoal     = dto.FitnessGoal,
            ExperienceLevel = dto.ExperienceLevel.HasValue
                ? (ExperienceLevel?)dto.ExperienceLevel.Value
                : null,
            CreatedAt       = now,
            UpdatedAt       = now
        };

        public static CoachProfile NewCoachProfile(Guid userId, UpdateCoachProfileDto dto, DateTime now) => new()
        {
            UserId            = userId,
            Bio               = dto.Bio,
            YearsOfExperience = dto.YearsOfExperience,
            Certifications    = dto.Certifications,
            Language          = dto.Language ?? string.Empty,
            CreatedAt         = now,
            UpdatedAt         = now
        };

        //                                   Update 

        public static void ApplyUpdate(UserProfile profile, UpdateUserProfileDto dto, DateTime now)
        {
            if (dto.FirstName         != null) profile.FirstName         = dto.FirstName;
            if (dto.LastName          != null) profile.LastName          = dto.LastName;
            if (dto.Phone             != null) profile.Phone             = dto.Phone;
            if (dto.ProfilePictureUrl != null) profile.ProfilePictureUrl = dto.ProfilePictureUrl;
            profile.UpdatedAt = now;
        }

        public static void ApplyUpdate(MemberProfile profile, UpdateMemberProfileDto dto, DateTime now)
        {
            if (dto.Gender           != null) profile.Gender          = dto.Gender;
            if (dto.DateOfBirth.HasValue)     profile.DateOfBirth     = DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc);
            if (dto.HeightCm.HasValue)        profile.HeightCm        = dto.HeightCm;
            if (dto.WeightKg.HasValue)        profile.WeightKg        = dto.WeightKg;
            if (dto.FitnessGoal      != null) profile.FitnessGoal     = dto.FitnessGoal;
            if (dto.ExperienceLevel.HasValue) profile.ExperienceLevel = (ExperienceLevel?)dto.ExperienceLevel.Value;
            profile.UpdatedAt = now;
        }

        public static void ApplyUpdate(CoachProfile profile, UpdateCoachProfileDto dto, DateTime now)
        {
            if (dto.Bio               != null) profile.Bio               = dto.Bio;
            if (dto.YearsOfExperience.HasValue) profile.YearsOfExperience = dto.YearsOfExperience;
            if (dto.Certifications    != null) profile.Certifications    = dto.Certifications;
            if (dto.Language          != null) profile.Language          = dto.Language;
            profile.UpdatedAt = now;
        }
    }
}
