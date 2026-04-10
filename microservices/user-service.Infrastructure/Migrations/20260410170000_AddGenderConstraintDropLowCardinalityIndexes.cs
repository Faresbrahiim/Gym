using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace user_service.Migrations
{
    /// <inheritdoc />
    public partial class AddGenderConstraintDropLowCardinalityIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop low-cardinality indexes on users — they hurt writes and never help reads
            migrationBuilder.DropIndex(
                name: "IX_users_Role",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_Status",
                table: "users");

            // Constrain gender to the three values the UI exposes
            migrationBuilder.AddCheckConstraint(
                name: "CK_MemberProfile_Gender",
                table: "member_profiles",
                sql: "\"Gender\" IN ('Male', 'Female', 'Other')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_MemberProfile_Gender",
                table: "member_profiles");

            migrationBuilder.CreateIndex(
                name: "IX_users_Role",
                table: "users",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_users_Status",
                table: "users",
                column: "Status");
        }
    }
}
