using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.Infrastructure.Persistence.Migrations
{
    public partial class AddUniqueDailyJournalPerUserDate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_daily_journals_user_id_journal_date_utc",
                table: "daily_journals",
                columns: new[] { "user_id", "journal_date_utc" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_daily_journals_user_id_journal_date_utc",
                table: "daily_journals");
        }
    }
}