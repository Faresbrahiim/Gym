using user_service.Models;

namespace user_service.Interfaces
{
    public interface IUserRepository
    {
        User GetByEmail(string email);
        User Create(User user);
        User Update(User user);

    }
}
