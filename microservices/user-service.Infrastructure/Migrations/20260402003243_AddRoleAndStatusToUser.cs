using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace user_service.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleAndStatusToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:user_role.user_role", "admin,coach,member")
                .Annotation("Npgsql:Enum:user_status.user_status", "pending,active,suspended,banned")
                .OldAnnotation("Npgsql:Enum:user_role.user_role", "admin,coach,member")
                .OldAnnotation("Npgsql:Enum:user_status.user_status", "pending,active,suspended");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:user_role.user_role", "admin,coach,member")
                .Annotation("Npgsql:Enum:user_status.user_status", "pending,active,suspended")
                .OldAnnotation("Npgsql:Enum:user_role.user_role", "admin,coach,member")
                .OldAnnotation("Npgsql:Enum:user_status.user_status", "pending,active,suspended,banned");
        }
    }
}
