
using Google.Apis.Auth;
namespace user_service.Application.Contracts.Services
{
    public interface IGoogleAuthValidator
    {
        public  Task<GoogleJsonWebSignature.Payload?> ValidateIdToken(string idToken);
    }
}
