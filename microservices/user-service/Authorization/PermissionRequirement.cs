using Microsoft.AspNetCore.Authorization;

namespace user_service.Authorization
{
    
        public class PermissionRequirement : IAuthorizationRequirement
        {
            public string Permission { get; }

            public PermissionRequirement(string permission)
            {
                Permission = permission;
            }
        }
}

