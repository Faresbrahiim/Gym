namespace user_service.Application.Events;

public class UserActivatedEvent
{
    public Guid UserId { get; init; }
    public string Email { get; init; } = default!;
    public string Role { get; init; } = default!;
}
