namespace user_service.Application.Domain.Exceptions
{
    public class ProfileNotFoundException : Exception
    {
        public ProfileNotFoundException(Guid userId)
            : base($"Profile for user '{userId}' was not found.") { }
    }
}
