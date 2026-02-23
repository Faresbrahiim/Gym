namespace user_service.Domain.Exceptions
{

    public class ExternalAuthException : Exception
    {
        public ExternalAuthException(string message) : base(message) { }
    }
}
