namespace user_service.Application.Domain.Exceptions

{
    public class UsernameAlreadyExistsException : Exception
    {
        public UsernameAlreadyExistsException(string username)
            : base($"Username '{username}' already exists.") { }
    }
}
