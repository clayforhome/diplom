using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Domain;
using TemplateProject.Services;

namespace TemplateProject.DataAccess;

public class DatabaseContext : IdentityDbContext<
    User, Role, Guid,
    IdentityUserClaim<Guid>,
    UserRole,
    IdentityUserLogin<Guid>,
    IdentityRoleClaim<Guid>,
    IdentityUserToken<Guid>>
{
    private const string IdentitySchema = "identity";
    
    private readonly CurrentUserProvider _currentUserProvider;

    public DatabaseContext(
        CurrentUserProvider currentUserProvider,
        DbContextOptions opt) : base(opt)
    {
        _currentUserProvider = currentUserProvider;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureOpenIdDictTables(modelBuilder);
        ConfigureIdentityTables(modelBuilder);
        ConfigureDictionaries(modelBuilder);
        ConfigureBusinessTables(modelBuilder);
    }

    private void ConfigureBusinessTables(ModelBuilder modelBuilder)
    {
    }

    private void ConfigureDictionaries(ModelBuilder modelBuilder)
    {
    }
    
    private void ConfigureIdentityTables(ModelBuilder builder)
    {
        builder.Entity<User>().ToTable("Users", IdentitySchema);
        builder.Entity<Role>().ToTable("Roles", IdentitySchema);
        builder.Entity<UserRole>(e =>
        {
            e.ToTable("UserRoles", IdentitySchema);
            e.HasKey(ur => new { ur.UserId, ur.RoleId });
            e.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);
            e.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);
        });
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens", IdentitySchema);
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims", IdentitySchema);
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins", IdentitySchema);
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims", IdentitySchema);

        builder.Entity<User>()
            .HasIndex(u => u.NormalizedEmail)
            .HasFilter($"\"{nameof(User.EmailConfirmed)}\" = true")
            .IsUnique();

        builder.Entity<User>()
            .HasIndex(u => u.PhoneNumber)
            .HasFilter($"\"{nameof(User.PhoneNumberConfirmed)}\" = true")
            .IsUnique();
    }

    private void ConfigureOpenIdDictTables(ModelBuilder builder)
    {
    }
}