using user_service.Models;

namespace user_service.Interfaces
{
    public interface IUserProfileRepository
    {
        UserProfile? GetByUserId(Guid userId);
        void Create(UserProfile profile);
        void Update(UserProfile profile);
    }
}
