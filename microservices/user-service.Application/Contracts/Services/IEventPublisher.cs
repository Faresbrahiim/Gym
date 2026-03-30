namespace user_service.Application.Contracts.Services;

public interface IEventPublisher
{
    Task PublishAsync<T>(string topic, T @event, CancellationToken cancellationToken = default);
}
