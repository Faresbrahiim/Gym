using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Threading.Tasks;
using user_service.Application.Interfaces;
using user_service.Loggings;

namespace user_service.Filters
{
    [AttributeUsage(AttributeTargets.Method)]
    public class AuditAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string _actionName;

        public AuditAttribute(string actionName)
        {
            _actionName = actionName;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var resultContext = await next();

            if (context.HttpContext.RequestServices.GetService(typeof(IFileAuditService)) is IFileAuditService auditService)
            {
                var username = context.HttpContext.User.Identity?.Name ?? "Anonymous";

                var maskedArgs = MaskSensitiveProperties(context.ActionArguments);

                var details = System.Text.Json.JsonSerializer.Serialize(maskedArgs);

                await auditService.LogAsync(_actionName, username, details);
            }
        }

        private object MaskSensitiveProperties(object obj)
        {
            if (obj == null) return null;

            // Handle dictionaries
            if (obj is IDictionary dict)
            {
                var clone = new Dictionary<object, object>();
                foreach (DictionaryEntry kv in dict)
                {
                    clone[kv.Key] = MaskSensitiveProperties(kv.Value);
                }
                return clone;
            }

            if (obj is IEnumerable list && !(obj is string))
            {
                var maskedList = new List<object>();
                foreach (var item in list)
                {
                    maskedList.Add(MaskSensitiveProperties(item));
                }
                return maskedList;
            }

           
            var type = obj.GetType();
            if (type.IsClass && type != typeof(string))
            {
                var clone = Activator.CreateInstance(type);
                foreach (var prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    if (!prop.CanRead || !prop.CanWrite) continue;

                    var value = prop.GetValue(obj);

                    // Mask sensitive fields
                    if (prop.Name.ToLower().Contains("password") ||
                        prop.Name.ToLower().Contains("token") ||
                        prop.Name.ToLower().Contains("secret"))
                    {
                        prop.SetValue(clone, "Nice try DIDI");
                    }
                    else
                    {
                        prop.SetValue(clone, MaskSensitiveProperties(value));
                    }
                }
                return clone;
            }

            return obj;
        }
    }
}