using user_service.Models;

namespace user_service.Interfaces
{
    public interface IUserRepository
    {
        User GetByEmail(string email);
        User Create(User user);
        User Update(User user);
        void AddExternalLogin(ExternalLogin externalLogin);
        ExternalLogin? GetExternalLogin(string provider, string providerUserId);
        User GetById(Guid userId);
        User? GetByUsername(string username);

    }
}
