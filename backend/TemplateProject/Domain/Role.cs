using Microsoft.AspNetCore.Identity;

namespace TemplateProject.Domain;

public class Role : IdentityRole<Guid>
{
    public const string User = "User";
    public const string Admin = "Admin";
    
    public List<UserRole> UserRoles { get; set; } = [];
}