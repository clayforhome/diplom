using Microsoft.AspNetCore.Identity;

namespace TemplateProject.Domain;

public class User : IdentityUser<Guid>
{
    public required string Name { get; set; }
    public int? Age { get; set; }
    public DateTime RegistrationDate { get; set; }
    
    /// <summary>
    /// Флаг мягкого удаления пользователя
    /// </summary>
    public bool IsDeleted { get; set; } = false;
    
    /// <summary>
    /// Время удаления пользователя
    /// </summary>
    public DateTime? DeletedAt { get; set; }
    
    /// <summary>
    /// ID администратора, который удалил пользователя
    /// </summary>
    public Guid? DeletedBy { get; set; }
    
    public List<UserRole> UserRoles { get; set; } = [];
    public List<Message> Messages { get; set; } = [];
}