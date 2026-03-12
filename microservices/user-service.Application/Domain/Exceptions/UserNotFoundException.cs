namespace user_service.Application.Domain.Exceptions

{
    public class UserNotFoundException : Exception
    {
        public UserNotFoundException(Guid userId)
            : base($"User with ID '{userId}' was not found.") { }
    }
}
