using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStoredFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "stored_files",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_type = table.Column<int>(type: "integer", nullable: false),
                    owner_entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    file_name = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    content_type = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    storage_key = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stored_files", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_stored_files_user_id_owner_type_owner_entity_id",
                table: "stored_files",
                columns: new[] { "user_id", "owner_type", "owner_entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_stored_files_user_id_status",
                table: "stored_files",
                columns: new[] { "user_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "stored_files");
        }
    }
}
