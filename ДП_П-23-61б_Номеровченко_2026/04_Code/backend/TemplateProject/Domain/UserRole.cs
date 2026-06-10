using Microsoft.AspNetCore.Identity;

namespace TemplateProject.Domain;

public class UserRole : IdentityUserRole<Guid>
{
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}