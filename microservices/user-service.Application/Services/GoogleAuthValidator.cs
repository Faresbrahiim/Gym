using Google.Apis.Auth;
using user_service.Application.Contracts.Services;

namespace user_service.Application.Services;

public class GoogleAuthValidator : IGoogleAuthValidator
{
    public async Task<GoogleJsonWebSignature.Payload?> ValidateIdToken(string idToken)
    {
        try
        {
            return await GoogleJsonWebSignature.ValidateAsync(idToken);
        }
        catch
        {
            return null;
        }
    }
}