namespace user_service.Application.Domain.Exceptions

{
    public class InvalidTokenException : Exception
    {
        public InvalidTokenException()
            : base("The token is invalid or expired.") { }
    }
}
