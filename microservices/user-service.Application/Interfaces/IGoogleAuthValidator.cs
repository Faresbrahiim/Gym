
using Google.Apis.Auth;
namespace user_service.Application.Interfaces
{
    public interface IGoogleAuthValidator
    {
        public  Task<GoogleJsonWebSignature.Payload?> ValidateIdToken(string idToken);
    }
}
