using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyJournalMarkdownFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "reflection",
                table: "daily_journals",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "trade_idea",
                table: "daily_journals",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "reflection",
                table: "daily_journals");

            migrationBuilder.DropColumn(
                name: "trade_idea",
                table: "daily_journals");
        }
    }
}
