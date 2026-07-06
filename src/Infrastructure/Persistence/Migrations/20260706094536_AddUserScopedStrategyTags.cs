using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserScopedStrategyTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "strategy_tags",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    normalized_name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_strategy_tags", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "strategy_tag_mappings",
                columns: table => new
                {
                    strategy_id = table.Column<Guid>(type: "uuid", nullable: false),
                    strategy_tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_strategy_tag_mappings", x => new { x.strategy_id, x.strategy_tag_id });
                    table.ForeignKey(
                        name: "FK_strategy_tag_mappings_strategies_strategy_id",
                        column: x => x.strategy_id,
                        principalTable: "strategies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_strategy_tag_mappings_strategy_tags_strategy_tag_id",
                        column: x => x.strategy_tag_id,
                        principalTable: "strategy_tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_strategy_tag_mappings_strategy_tag_id",
                table: "strategy_tag_mappings",
                column: "strategy_tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_strategy_tags_user_id_normalized_name",
                table: "strategy_tags",
                columns: new[] { "user_id", "normalized_name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "strategy_tag_mappings");

            migrationBuilder.DropTable(
                name: "strategy_tags");
        }
    }
}
