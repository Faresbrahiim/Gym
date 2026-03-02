using user_service.Application.Entities;

namespace user_service.Interfaces
{
    public interface IPasswordResetTokenRepository
    {
        void Create(PasswordResetToken token);
        public PasswordResetToken? GetValidToken(string tokenHash);
        public void Update(PasswordResetToken token);
 
    }
}
