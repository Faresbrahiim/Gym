using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.DTOs;
using user_service.Application.Enums;
using user_service.Application.Interfaces;

namespace user_service.Infrastructure.Services
{
    public class UserProfileService : IUserProfileService
    {
        private readonly IUserRepository _userRepository;

        public UserProfileService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserMeDto> GetMeAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetFullById(userId, cancellationToken);

            if (user == null)
                throw new Exception("User not found");

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

            // Member
            if (user.Role == UserRole.MEMBER && user.MemberProfile != null)
            {
                result.MemberProfile = new MemberProfileDto
                {
                    Gender = user.MemberProfile.Gender,
                    FitnessGoal = user.MemberProfile.FitnessGoal,
                    ExperienceLevel = (int?)user.MemberProfile.ExperienceLevel,
                    HeightCm = user.MemberProfile.HeightCm,
                    WeightKg = user.MemberProfile.WeightKg
                };
            }

            // Coach
            if (user.Role == UserRole.COACH && user.CoachProfile != null)
            {
                result.CoachProfile = new CoachProfileDto
                {
                    Language = user.CoachProfile.Language,
                    YearsOfExperience = (int)user.CoachProfile.YearsOfExperience,
                    Bio = user.CoachProfile.Bio
                };
            }

            return result;
        }

        public async Task UpdateMeAsync(
            Guid userId,
            UpdateUserProfileDto dto,
            CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetFullById(userId, cancellationToken);

            if (user == null)
                throw new Exception("User not found");

            if (user.Profile == null)
                throw new Exception("Profile not found");

            user.Profile.FirstName = dto.FirstName;
            user.Profile.LastName = dto.LastName;
            user.Profile.Phone = dto.Phone;
            user.Profile.ProfilePictureUrl = dto.ProfilePictureUrl;
            user.Profile.UpdatedAt = DateTime.UtcNow;

            await _userRepository.Update(user, cancellationToken);
        }
    }
}
