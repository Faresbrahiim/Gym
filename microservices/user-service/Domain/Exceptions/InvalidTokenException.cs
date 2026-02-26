namespace user_service.Domain.Exceptions
{
    public class InvalidTokenException : Exception
    {
        public InvalidTokenException()
            : base("The token is invalid or expired.") { }
    }
}
