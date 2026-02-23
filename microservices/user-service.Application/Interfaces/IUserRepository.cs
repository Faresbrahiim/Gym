using user_service.Application.Entities;

namespace user_service.Application.Interfaces
{
    public interface IUserRepository
    {
        User GetByEmail(string email);
        User Create(User user);
        User Update(User user);
        void AddExternalLogin(ExternalLogin externalLogin);
        ExternalLogin? GetExternalLogin(string provider, string providerUserId);
        User GetById(Guid userId);


    }
}
