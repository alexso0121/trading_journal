using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyJournalScreenshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "daily_journal_screenshots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    daily_journal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_key = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    download_url = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_journal_screenshots", x => x.id);
                    table.ForeignKey(
                        name: "FK_daily_journal_screenshots_daily_journals_daily_journal_id",
                        column: x => x.daily_journal_id,
                        principalTable: "daily_journals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_daily_journal_screenshots_daily_journal_id_created_at_utc",
                table: "daily_journal_screenshots",
                columns: new[] { "daily_journal_id", "created_at_utc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_journal_screenshots");
        }
    }
}
