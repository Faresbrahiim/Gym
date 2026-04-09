namespace user_service.Application.Domain.Exceptions
{
    public class AccountNotActivatedException : Exception
    {
        public AccountNotActivatedException()
            : base("Account is not activated. Please verify your email.") { }
    }
}
