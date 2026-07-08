using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChecklistSettingsAndJournalChecklistItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "checklist_config_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sequence = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_checklist_config_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "daily_journal_checklist_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    daily_journal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    config_item_id = table.Column<Guid>(type: "uuid", nullable: true),
                    label_snapshot = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sequence = table.Column<int>(type: "integer", nullable: false),
                    is_checked = table.Column<bool>(type: "boolean", nullable: false),
                    checked_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_journal_checklist_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_daily_journal_checklist_items_checklist_config_items_config~",
                        column: x => x.config_item_id,
                        principalTable: "checklist_config_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_daily_journal_checklist_items_daily_journals_daily_journal_~",
                        column: x => x.daily_journal_id,
                        principalTable: "daily_journals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_checklist_config_items_user_id_sequence",
                table: "checklist_config_items",
                columns: new[] { "user_id", "sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_daily_journal_checklist_items_config_item_id",
                table: "daily_journal_checklist_items",
                column: "config_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_daily_journal_checklist_items_daily_journal_id_sequence",
                table: "daily_journal_checklist_items",
                columns: new[] { "daily_journal_id", "sequence" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_journal_checklist_items");

            migrationBuilder.DropTable(
                name: "checklist_config_items");
        }
    }
}
