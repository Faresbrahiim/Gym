namespace user_service.Application.Domain.Exceptions

{
    public class InvalidCredentialsException : Exception
    {
        public InvalidCredentialsException() : base("Invalid credentials") { }
    }
}
