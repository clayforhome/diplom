using Microsoft.AspNetCore.Identity;

namespace TemplateProject.Domain;

public class User : IdentityUser<Guid>
{
    public int? Age { get; set; }
    public DateTime RegistrationDate { get; set; }
    
    public List<UserRole> UserRoles { get; set; } = [];
}