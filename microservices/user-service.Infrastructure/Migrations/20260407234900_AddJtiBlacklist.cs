using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace user_service.Migrations
{
    /// <inheritdoc />
    public partial class AddJtiBlacklist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AccessTokenExpiresAt",
                table: "refresh_tokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccessTokenJti",
                table: "refresh_tokens",
                type: "character varying(36)",
                maxLength: 36,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "revoked_tokens",
                columns: table => new
                {
                    Jti = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_revoked_tokens", x => x.Jti);
                });

            migrationBuilder.CreateIndex(
                name: "IX_revoked_tokens_ExpiresAt",
                table: "revoked_tokens",
                column: "ExpiresAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "revoked_tokens");

            migrationBuilder.DropColumn(
                name: "AccessTokenExpiresAt",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "AccessTokenJti",
                table: "refresh_tokens");
        }
    }
}
