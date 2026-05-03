using System;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using user_service.Application.Domain.Exceptions;

namespace user_service.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unhandled exception | Method: {Method} | Path: {Path} | TraceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.TraceIdentifier);

                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var statusCode = exception switch
            {
                UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                KeyNotFoundException => StatusCodes.Status404NotFound,
                ArgumentException => StatusCodes.Status400BadRequest,

                // Custom Auth exceptions
                EmailAlreadyExistsException => StatusCodes.Status409Conflict,
                UsernameAlreadyExistsException => StatusCodes.Status409Conflict,
                InvalidTokenException => StatusCodes.Status403Forbidden,
                AccountNotActivatedException => StatusCodes.Status403Forbidden,
                UserNotFoundException => StatusCodes.Status404NotFound,
                ProfileNotFoundException => StatusCodes.Status404NotFound,
                ExternalAuthException => StatusCodes.Status401Unauthorized,
                EmailDeliveryException => StatusCodes.Status502BadGateway,

                _ => StatusCodes.Status500InternalServerError
            };

            var message = exception switch
            {
                UnauthorizedAccessException       => "Invalid credentials.",
                AccountNotActivatedException      => "Your account is not active.",
                EmailAlreadyExistsException       => "An account with this email already exists.",
                UsernameAlreadyExistsException    => "This username is already taken.",
                InvalidTokenException             => "The token is invalid or has expired.",
                UserNotFoundException             => "User not found.",
                ProfileNotFoundException          => "Profile not found.",
                ExternalAuthException             => "Authentication failed.",
                EmailDeliveryException            => "The invitation was created but the email could not be sent. Please use resend invitation.",
                KeyNotFoundException              => "Resource not found.",
                ArgumentException                 => exception.Message,
                _                                 => "An unexpected error occurred."
            };

            var response = new
            {
                success = false,
                message,
                traceId = context.TraceIdentifier
            };

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var json = JsonSerializer.Serialize(response);

            return context.Response.WriteAsync(json);
        }
    }
}