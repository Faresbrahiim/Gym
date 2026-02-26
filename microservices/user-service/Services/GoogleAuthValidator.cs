using Google.Apis.Auth;
using user_service.Application.Interfaces;
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