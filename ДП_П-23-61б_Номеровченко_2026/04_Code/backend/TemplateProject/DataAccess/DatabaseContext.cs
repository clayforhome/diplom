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
    
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();
    public DbSet<MeetingFile> MeetingFiles => Set<MeetingFile>();
    public DbSet<Message> Messages => Set<Message>();

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
        // Configure Meeting table
        modelBuilder.Entity<Meeting>(builder =>
        {
            builder.ToTable("Meetings");
            builder.HasKey(m => m.Id);
            
            builder.Property(m => m.Title).IsRequired().HasMaxLength(255);
            builder.Property(m => m.Description).HasColumnType("text");
            builder.Property(m => m.Format).HasDefaultValue(MeetingFormat.Offline);
            builder.Property(m => m.Status).HasDefaultValue(MeetingStatus.Draft);
            builder.Property(m => m.IsDeleted).HasDefaultValue(false);
            builder.Property(m => m.Location).HasMaxLength(500);
            builder.Property(m => m.MeetingLink).HasMaxLength(500);
            builder.Property(m => m.ContactInfo).HasMaxLength(255);
            
            builder.HasOne(m => m.Organizer)
                .WithMany()
                .HasForeignKey(m => m.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);
                
            builder.HasOne(m => m.DeletedByUser)
                .WithMany()
                .HasForeignKey(m => m.DeletedBy)
                .OnDelete(DeleteBehavior.SetNull);
            
            builder.HasIndex(m => m.OrganizerId);
            builder.HasIndex(m => m.Status);
            builder.HasIndex(m => new { m.IsDeleted, m.Status });
        });
        
        // Configure MeetingParticipant table
        modelBuilder.Entity<MeetingParticipant>(builder =>
        {
            builder.ToTable("MeetingParticipants");
            builder.HasKey(mp => mp.Id);
            
            builder.Property(mp => mp.InvitationStatus).HasDefaultValue(InvitationStatus.Pending);
            builder.Property(mp => mp.IsRequired).HasDefaultValue(false);
            builder.Property(mp => mp.Comment).HasColumnType("text");
            
            builder.HasOne(mp => mp.Meeting)
                .WithMany(m => m.Participants)
                .HasForeignKey(mp => mp.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
                
            builder.HasOne(mp => mp.User)
                .WithMany()
                .HasForeignKey(mp => mp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            builder.HasIndex(mp => new { mp.MeetingId, mp.UserId }).IsUnique();
            builder.HasIndex(mp => mp.InvitationStatus);
        });
        
        // Configure MeetingFile table
        modelBuilder.Entity<MeetingFile>(builder =>
        {
            builder.ToTable("MeetingFiles");
            builder.HasKey(mf => mf.Id);
            
            builder.Property(mf => mf.FileName).IsRequired().HasMaxLength(255);
            builder.Property(mf => mf.FilePath).IsRequired().HasMaxLength(500);
            builder.Property(mf => mf.FileType).IsRequired().HasMaxLength(100);
            
            builder.HasOne(mf => mf.Meeting)
                .WithMany(m => m.Files)
                .HasForeignKey(mf => mf.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
                
            builder.HasOne(mf => mf.UploadedBy)
                .WithMany()
                .HasForeignKey(mf => mf.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
            
            builder.HasIndex(mf => mf.MeetingId);
        });
        
        // Configure Message table
        modelBuilder.Entity<Message>(builder =>
        {
            builder.ToTable("Messages");
            builder.HasKey(m => m.Id);
            
            builder.Property(m => m.Subject).IsRequired().HasMaxLength(255);
            builder.Property(m => m.Body).IsRequired().HasColumnType("text");
                
            builder.HasOne(m => m.Recipient)
                .WithMany()
                .HasForeignKey(m => m.RecipientId)
                .OnDelete(DeleteBehavior.Cascade);
                
            builder.HasOne(m => m.Meeting)
                .WithMany()
                .HasForeignKey(m => m.MeetingId)
                .OnDelete(DeleteBehavior.SetNull);
            
            builder.HasIndex(m => m.RecipientId);
            builder.HasIndex(m => m.SentAt);
        });
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

        // Configure User soft delete
        
        builder.Entity<User>()
            .HasIndex(u => u.IsDeleted);

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