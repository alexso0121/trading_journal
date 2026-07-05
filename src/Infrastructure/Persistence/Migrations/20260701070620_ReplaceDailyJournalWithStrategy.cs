using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.src.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceDailyJournalWithStrategy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_trades_daily_journals_daily_journal_id",
                table: "trades");

            migrationBuilder.RenameColumn(
                name: "daily_journal_id",
                table: "trades",
                newName: "strategy_id");

            migrationBuilder.RenameIndex(
                name: "IX_trades_daily_journal_id",
                table: "trades",
                newName: "IX_trades_strategy_id");

            migrationBuilder.CreateTable(
                name: "strategies",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_strategies", x => x.id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_trades_strategies_strategy_id",
                table: "trades",
                column: "strategy_id",
                principalTable: "strategies",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_trades_strategies_strategy_id",
                table: "trades");

            migrationBuilder.DropTable(
                name: "strategies");

            migrationBuilder.RenameColumn(
                name: "strategy_id",
                table: "trades",
                newName: "daily_journal_id");

            migrationBuilder.RenameIndex(
                name: "IX_trades_strategy_id",
                table: "trades",
                newName: "IX_trades_daily_journal_id");

            migrationBuilder.AddForeignKey(
                name: "FK_trades_daily_journals_daily_journal_id",
                table: "trades",
                column: "daily_journal_id",
                principalTable: "daily_journals",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
