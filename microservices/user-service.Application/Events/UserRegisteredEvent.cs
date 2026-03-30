namespace user_service.Application.Events;

public class UserRegisteredEvent
{
    public Guid UserId { get; init; }
    public string Email { get; init; } = default!;
}
