using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace trading_journel_app.src.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseVersionForOptimisticConcurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "trades",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "strategies",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "version",
                table: "trades");

            migrationBuilder.DropColumn(
                name: "version",
                table: "strategies");
        }
    }
}
