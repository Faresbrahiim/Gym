using System.Security.Claims;
using user_service.Authorization;
using user_service.Application.Enums;
using user_service.Application.Entities;

namespace user_service.Authorization
{
    public class RolePermissionMapping
    {
        public static IEnumerable<string> GetPermissions(UserRole role)
        {
            return role switch
            {
                UserRole.ADMIN => new[]
                {
                    Permissions.UsersCreate,
                    Permissions.UsersActivate,
                    Permissions.UsersSuspend,
                    Permissions.UsersViewAll
                },

                UserRole.COACH => new[]
                {
                    Permissions.MembersViewAssigned
                },

                UserRole.MEMBER => Array.Empty<string>(),

                _ => Array.Empty<string>()
            };
        }
    }
}

//Note regarding JWT: (claims must be updated to assigb proper role (faress dir chi haja bhal haka .))
//var claims = new List<Claim>
//{
//    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
//    new Claim(ClaimTypes.Role, user.Role.ToString())
//};

//var permissions = RolePermissionMapping.GetPermissions(user.Role);

//foreach (var permission in permissions)
//{
//    claims.Add(new Claim("permission", permission));
//}
