using user_service.Application.Entities;
namespace user_service.Interfaces
{
    public interface IUserProfileRepository
    {
        UserProfile? GetByUserId(Guid userId);
        void Create(UserProfile profile);
        void Update(UserProfile profile);
    }
}
