namespace user_service.Application.Domain.Exceptions
{

    public class ExternalAuthException : Exception
    {
        public ExternalAuthException(string message) : base(message) { }
    }
}
