namespace user_service.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;

        var userId = context.User?.Identity?.IsAuthenticated == true
            ? context.User.FindFirst("sub")?.Value
            : "anonymous";

        _logger.LogInformation(
            "Request started | Method: {Method} | Path: {Path} | User: {UserId} | TraceId: {TraceId}",
            context.Request.Method,
            context.Request.Path,
            userId,
            context.TraceIdentifier);

        await _next(context);

        var duration = (DateTime.UtcNow - start).TotalMilliseconds;

        _logger.LogInformation(
            "Request completed | Method: {Method} | Path: {Path} | StatusCode: {StatusCode} | DurationMs: {Duration} | TraceId: {TraceId}",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            duration,
            context.TraceIdentifier);
    }
}