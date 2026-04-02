namespace user_service.Application.Authorization
{
    public class Permissions
    {
        public const string UsersCreate = "users.create";
        public const string UsersActivate = "users.activate";
        public const string UsersSuspend = "users.suspend";
        public const string UsersViewAll = "users.view.all";
        public const string UsersManage = "users.manage";

        // Coach 
        public const string MembersViewAssigned = "members.view.assigned";

    }
}
