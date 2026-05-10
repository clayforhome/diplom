using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TemplateProject.Migrations
{
    /// <inheritdoc />
    public partial class RemovedNameProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                schema: "identity",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "identity",
                table: "Users",
                type: "text",
                nullable: true);
        }
    }
}
