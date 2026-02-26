using Google.Apis.Auth;

public static class GoogleAuthValidator
{
    public static GoogleJsonWebSignature.Payload? ValidateIdToken(string idToken)
    {
        try
        {
            return GoogleJsonWebSignature.ValidateAsync(idToken).GetAwaiter().GetResult();
        }
        catch
        {
            return null;
        }
    }
}