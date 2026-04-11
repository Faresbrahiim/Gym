using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace user_service.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCoachAvailability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "coach_availability");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "coach_availability",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CoachId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coach_availability", x => x.Id);
                    table.CheckConstraint("CK_CoachAvailability_Day", "\"DayOfWeek\" BETWEEN 0 AND 6");
                    table.CheckConstraint("CK_CoachAvailability_Time", "\"StartTime\" < \"EndTime\"");
                    table.ForeignKey(
                        name: "FK_coach_availability_users_CoachId",
                        column: x => x.CoachId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coach_availability_CoachId",
                table: "coach_availability",
                column: "CoachId");
        }
    }
}
