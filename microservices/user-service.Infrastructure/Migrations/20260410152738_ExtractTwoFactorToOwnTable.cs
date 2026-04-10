using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace user_service.Migrations
{
    /// <inheritdoc />
    public partial class ExtractTwoFactorToOwnTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: create the new table first
            migrationBuilder.CreateTable(
                name: "user_two_factor",
                columns: table => new
                {
                    UserId    = table.Column<Guid>(type: "uuid", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Secret    = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_two_factor", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_user_two_factor_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Step 2: copy existing 2FA data before dropping the source columns
            migrationBuilder.Sql(@"
                INSERT INTO user_two_factor (""UserId"", ""IsEnabled"", ""Secret"", ""CreatedAt"", ""UpdatedAt"")
                SELECT ""Id"", ""TwoFactorEnabled"", ""TwoFactorSecret"", NOW(), NOW()
                FROM users
                WHERE ""TwoFactorEnabled"" = true OR ""TwoFactorSecret"" IS NOT NULL;
            ");

            // Step 3: drop the columns from users only after data is safely copied
            migrationBuilder.DropColumn(
                name: "TwoFactorEnabled",
                table: "users");

            migrationBuilder.DropColumn(
                name: "TwoFactorSecret",
                table: "users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_two_factor");

            migrationBuilder.AddColumn<bool>(
                name: "TwoFactorEnabled",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TwoFactorSecret",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
