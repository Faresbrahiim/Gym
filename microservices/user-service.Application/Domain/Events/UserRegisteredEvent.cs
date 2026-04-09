namespace user_service.Application.Domain.Events;

public class UserRegisteredEvent
{
    public Guid UserId { get; init; }
    public string Email { get; init; } = default!;
}
