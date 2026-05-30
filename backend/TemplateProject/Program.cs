using System.Net;
using System.Text.Json.Serialization;
using TemplateProject;
using TemplateProject.DataAccess;
using TemplateProject.Domain;
using TemplateProject.Features;
using TemplateProject.Middlewares;
using TemplateProject.OpenApiDocumentTransformers;
using TemplateProject.Services;
using TemplateProject.Settings;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using IPNetwork = Microsoft.AspNetCore.HttpOverrides.IPNetwork;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<DatabaseContext>((sp, opt) =>
{
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Database"));

    if (builder.Environment.IsDevelopment())
    {
        opt.EnableSensitiveDataLogging();
    }
});

builder.Services.Configure<ForwardedHeadersOptions>(opt =>
{
    opt.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    opt.KnownProxies.Add(IPAddress.Parse("127.0.0.1")); // for localhost
    opt.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("172.16.0.0"), 12)); // for docker env
});

builder.Services.AddControllers();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddMediatR(opt => { opt.RegisterServicesFromAssemblyContaining<Program>(); });
builder.Services.AddOpenApi(opt =>
{
    opt.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
    opt.AddSchemaTransformer<OneOfSimplifier>();
});
builder.Services.AddTransient<TimeProvider>(_ => TimeProvider.System);
builder.Services.AddScoped<CurrentUserProvider>();
builder.Services.AddTransient<IEmailNotificationService, EmailNotificationService>();

builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));

builder.Services.AddAuthorizationBuilder()
    .AddDefaultPolicy(AuthorizationPolicy.UserPolicy, policy => policy.RequireAuthenticatedUser())
    .AddPolicy(AuthorizationPolicy.OnlyAdminPolicy, policy => policy.RequireRole(Role.Admin))
    .AddPolicy(AuthorizationPolicy.ManagementPolicy, policy => policy.RequireRole(Role.Admin, Role.Organizer))
    ;

builder.Services.Configure<AuthSettings>(builder.Configuration.GetSection("Auth"));
builder.Services.AddAuthorization();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var authOptions = builder.Configuration.GetSection("Auth").Get<AuthSettings>();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = authOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = authOptions.Audience,
            ValidateLifetime = true,
            IssuerSigningKey = authOptions.GetSymmetricSecurityKey(),
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                if (!string.IsNullOrEmpty(accessToken))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services
    .AddIdentityCore<User>()
    .AddRoles<Role>()
    .AddSignInManager()
    .AddEntityFrameworkStores<DatabaseContext>()
    .AddDefaultTokenProviders();
;

// Configure the HTTP request pipeline.
var app = builder.Build();

app.UseForwardedHeaders();
app.UseMiddleware<ExceptionFilterMiddleware>();

using (var scope = app.Services.CreateScope())
{
    var serviceProvider = scope.ServiceProvider;

    var context = serviceProvider.GetRequiredService<DatabaseContext>();

    await ApplyMigrationsWithRetryAsync(scope, context, app.Configuration, app.Logger);
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// CORS must be BEFORE UseRouting and Authentication
app.UseCors(c =>
    c.AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(c => { c.SwaggerEndpoint("/openapi/v1.json", "TemplateProject API V1"); });
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
}


RegisterFeatureEndpoints(app);

app.Run();

return;

void RegisterFeatureEndpoints(WebApplication webApplication)
{
    var types = typeof(Program).Assembly.GetTypes();
    var endpointRegistrations = types
        .Where(t => t is { IsAbstract: false, IsInterface: false })
        .Where(t => typeof(IFeatureEndpoint).IsAssignableFrom(t))
        .ToList();

    foreach (var registration in endpointRegistrations)
    {
        var featureEndpoint = (IFeatureEndpoint)Activator.CreateInstance(registration)!;

        var groupMap = webApplication
            .MapGroup("")
            .AddEndpointFilter<BaseResponseFilter>();

        featureEndpoint.Map(groupMap);
    }
}

async Task SetupInitialDataAsync(IServiceScope serviceScope, IConfiguration configuration, DatabaseContext context)
{
    var adminLogin = configuration.GetValue<string>("AdminCredentials:Email")!;
    var adminPassword = configuration.GetValue<string>("AdminCredentials:Password")!;

    var userLogin = configuration.GetValue<string>("UserCredentials:Email")!;
    var userPassword = configuration.GetValue<string>("UserCredentials:Password")!;

    var organizerLogin = configuration.GetValue<string>("OrganizerCredentials:Email")!;
    var organizerPassword = configuration.GetValue<string>("OrganizerCredentials:Password")!;
    
    var qaLogin = configuration.GetValue<string>("QACredentials:Email")!;
    var qaPassword = configuration.GetValue<string>("QACredentials:Password")!;
    
    var analystLogin = configuration.GetValue<string>("AnalystCredentials:Email")!;
    var analystPassword = configuration.GetValue<string>("AnalystCredentials:Password")!;
    
    var supportLogin = configuration.GetValue<string>("SupportCredentials:Email")!;
    var supportPassword = configuration.GetValue<string>("SupportCredentials:Password")!;
    
    var backupLogin = configuration.GetValue<string>("BackupCredentials:Email")!;
    var backupPassword = configuration.GetValue<string>("BackupCredentials:Password")!;
    

    var userManager = serviceScope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = serviceScope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

    await EnsureRoleExistsAsync(roleManager, Role.Admin);
    await EnsureRoleExistsAsync(roleManager, Role.User);
    await EnsureRoleExistsAsync(roleManager, Role.Organizer);

    var adminUser = await EnsureUserAsync(userManager, adminLogin, adminPassword, "Админ Системов");
    var userUser = await EnsureUserAsync(userManager, userLogin, userPassword, "Пользователь Тестов");
    var organizerUser = await EnsureUserAsync(userManager, organizerLogin, organizerPassword, "Организатор Встречин");
    var qaUser = await EnsureUserAsync(userManager, qaLogin, qaPassword, "Инженер Тестов");
    var analystUser = await EnsureUserAsync(userManager, analystLogin, analystPassword, "Аналитик Процессов");
    var supportUser = await EnsureUserAsync(userManager, supportLogin, supportPassword, "Менеджер Поддержки");
    var backupOrganizer = await EnsureUserAsync(userManager, backupLogin, backupPassword, "Координатор Резервный");

    await EnsureOnlyRolesAsync(userManager, adminUser, [Role.Admin]);
    await EnsureOnlyRolesAsync(userManager, userUser, [Role.User]);
    await EnsureOnlyRolesAsync(userManager, organizerUser, [Role.Organizer]);
    await EnsureOnlyRolesAsync(userManager, qaUser, [Role.User]);
    await EnsureOnlyRolesAsync(userManager, analystUser, [Role.User]);
    await EnsureOnlyRolesAsync(userManager, supportUser, [Role.User]);
    await EnsureOnlyRolesAsync(userManager, backupOrganizer, [Role.Organizer]);

    context.ChangeTracker.Clear();

    await EnsureTestDataAsync(
        context,
        adminUser,
        userUser,
        organizerUser,
        qaUser,
        analystUser,
        supportUser,
        backupOrganizer);
}

async Task EnsureRoleExistsAsync(RoleManager<Role> roleManager, string roleName)
{
    if (await roleManager.RoleExistsAsync(roleName))
    {
        return;
    }

    await EnsureIdentitySucceededAsync(await roleManager.CreateAsync(new Role
    {
        Name = roleName,
    }));
}

async Task<User> EnsureUserAsync(UserManager<User> userManager, string email, string password, string fullName)
{
    var user = await userManager.FindByEmailAsync(email);

    if (user != null)
    {
        var shouldUpdate = false;

        if (!string.Equals(user.UserName, fullName, StringComparison.Ordinal))
        {
            user.Name = fullName;
            shouldUpdate = true;
        }

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            shouldUpdate = true;
        }

        if (shouldUpdate)
        {
            await EnsureIdentitySucceededAsync(await userManager.UpdateAsync(user));
        }

        return user;
    }

    user = new User
    {
        Id = Guid.NewGuid(),
        UserName = email,
        Email = email,
        EmailConfirmed = true,
        Name = fullName,
        RegistrationDate = TimeProvider.System.GetUtcNow().UtcDateTime,
        Age = 25
    };

    await EnsureIdentitySucceededAsync(await userManager.CreateAsync(user, password));
    return user;
}

async Task EnsureOnlyRolesAsync(UserManager<User> userManager, User user, IEnumerable<string> expectedRoles)
{
    var currentRoles = await userManager.GetRolesAsync(user);
    var expectedRoleSet = expectedRoles.ToHashSet(StringComparer.Ordinal);
    var rolesToRemove = currentRoles.Where(role => !expectedRoleSet.Contains(role)).ToArray();

    if (rolesToRemove.Length > 0)
    {
        await EnsureIdentitySucceededAsync(await userManager.RemoveFromRolesAsync(user, rolesToRemove));
    }

    foreach (var role in expectedRoleSet)
    {
        if (!currentRoles.Contains(role, StringComparer.Ordinal))
        {
            await EnsureIdentitySucceededAsync(await userManager.AddToRoleAsync(user, role));
        }
    }
}

Task EnsureIdentitySucceededAsync(IdentityResult result)
{
    if (result.Succeeded)
    {
        return Task.CompletedTask;
    }

    var errors = string.Join("; ", result.Errors.Select(x => $"{x.Code}: {x.Description}"));
    throw new InvalidOperationException($"Identity seeding failed: {errors}");
}

async Task EnsureTestDataAsync(
    DatabaseContext context,
    User adminUser,
    User userUser,
    User organizerUser,
    User qaUser,
    User analystUser,
    User supportUser,
    User backupOrganizer)
{
    var now = DateTime.UtcNow;
    var baseDate = now.Date.AddDays(1);

    var meetingSeeds = new[]
    {
        new MeetingSeed(
            "Планирование релиза Q2",
            "Обсуждение задач и контрольных точек перед выпуском версии.",
            organizerUser.Id,
            MeetingFormat.Offline,
            MeetingStatus.Draft,
            baseDate.AddDays(1),
            baseDate.AddDays(1).AddHours(10),
            baseDate.AddDays(1).AddHours(11).AddMinutes(30),
            "Конференц-зал А",
            null,
            "Внутренний номер 101"),
        new MeetingSeed(
            "Еженедельный онлайн-стендап",
            "Короткий синк по текущим блокерам команды.",
            organizerUser.Id,
            MeetingFormat.Online,
            MeetingStatus.Scheduled,
            baseDate.AddDays(2),
            baseDate.AddDays(2).AddHours(9),
            baseDate.AddDays(2).AddHours(9).AddMinutes(30),
            null,
            "https://meet.example.local/standup",
            "@organizer"),
        new MeetingSeed(
            "Согласование бюджета проекта",
            "Подтверждение бюджета и обсуждение рисков.",
            adminUser.Id,
            MeetingFormat.Hybrid,
            MeetingStatus.AwaitingConfirmation,
            baseDate.AddDays(3),
            baseDate.AddDays(3).AddHours(14),
            baseDate.AddDays(3).AddHours(15),
            "Переговорная B-12",
            "https://meet.example.local/budget",
            "finance-team@example.local"),
        new MeetingSeed(
            "Созвон с подрядчиком",
            "Обсуждение интеграции и сроков поставки.",
            backupOrganizer.Id,
            MeetingFormat.Phone,
            MeetingStatus.Confirmed,
            baseDate.AddDays(4),
            baseDate.AddDays(4).AddHours(16),
            baseDate.AddDays(4).AddHours(16).AddMinutes(45),
            null,
            null,
            "+7 700 000 00 01"),
        new MeetingSeed(
            "Перенос демо для заказчика",
            "Сверка нового времени показа и списка участников.",
            organizerUser.Id,
            MeetingFormat.Online,
            MeetingStatus.Rescheduled,
            baseDate.AddDays(5),
            baseDate.AddDays(5).AddHours(12),
            baseDate.AddDays(5).AddHours(13),
            null,
            "https://meet.example.local/customer-demo",
            "sales@example.local"),
        new MeetingSeed(
            "Отмененная встреча по аудиту",
            "Сессия отменена из-за недоступности ключевых участников.",
            adminUser.Id,
            MeetingFormat.Offline,
            MeetingStatus.Cancelled,
            baseDate.AddDays(-2),
            baseDate.AddDays(-2).AddHours(11),
            baseDate.AddDays(-2).AddHours(12),
            "Архивная переговорная",
            null,
            "audit@example.local"),
        new MeetingSeed(
            "Ретроспектива спринта",
            "Финальная ретроспектива по завершенному спринту.",
            backupOrganizer.Id,
            MeetingFormat.Hybrid,
            MeetingStatus.Completed,
            baseDate.AddDays(-1),
            baseDate.AddDays(-1).AddHours(17),
            baseDate.AddDays(-1).AddHours(18),
            "Комната Agile",
            "https://meet.example.local/retro",
            "scrum-master@example.local")
    };

    var meetingMap = new Dictionary<string, Meeting>(StringComparer.Ordinal);

    foreach (var seed in meetingSeeds)
    {
        var meeting = await context.Meetings.FirstOrDefaultAsync(x => x.Title == seed.Title);

        if (meeting == null)
        {
            meeting = new Meeting
            {
                Id = Guid.NewGuid(),
                Title = seed.Title,
                Description = seed.Description,
                OrganizerId = seed.OrganizerId,
                Format = seed.Format,
                Status = seed.Status,
                Date = seed.Date,
                StartTime = seed.StartTime,
                EndTime = seed.EndTime,
                Location = seed.Location,
                MeetingLink = seed.MeetingLink,
                ContactInfo = seed.ContactInfo,
                CreatedAt = now,
                UpdatedAt = now
            };

            context.Meetings.Add(meeting);
        }
        else
        {
            meeting.Description = seed.Description;
            meeting.OrganizerId = seed.OrganizerId;
            meeting.Format = seed.Format;
            meeting.Status = seed.Status;
            meeting.Date = seed.Date;
            meeting.StartTime = seed.StartTime;
            meeting.EndTime = seed.EndTime;
            meeting.Location = seed.Location;
            meeting.MeetingLink = seed.MeetingLink;
            meeting.ContactInfo = seed.ContactInfo;
            meeting.IsDeleted = false;
            meeting.DeletedAt = null;
            meeting.DeletedBy = null;
            meeting.UpdatedAt = now;
        }

        meetingMap[seed.Title] = meeting;
    }

    await context.SaveChangesAsync();

    var participantSeeds = new[]
    {
        new MeetingParticipantSeed("Планирование релиза Q2", userUser.Id, InvitationStatus.Pending, true, now, null, "Ожидается подтверждение участия."),
        new MeetingParticipantSeed("Планирование релиза Q2", qaUser.Id, InvitationStatus.Accepted, true, now.AddHours(-3), now.AddHours(-1), "Подтвердил участие."),
        new MeetingParticipantSeed("Планирование релиза Q2", analystUser.Id, InvitationStatus.Accepted, false, now.AddHours(-3), now.AddHours(-2), null),
        new MeetingParticipantSeed("Еженедельный онлайн-стендап", userUser.Id, InvitationStatus.Accepted, true, now.AddDays(-1), now.AddHours(-4), null),
        new MeetingParticipantSeed("Еженедельный онлайн-стендап", supportUser.Id, InvitationStatus.Pending, false, now.AddDays(-1), null, "Подключится при наличии инцидентов."),
        new MeetingParticipantSeed("Согласование бюджета проекта", analystUser.Id, InvitationStatus.Pending, true, now.AddHours(-6), null, "Нужен расчёт по CAPEX."),
        new MeetingParticipantSeed("Согласование бюджета проекта", supportUser.Id, InvitationStatus.Declined, false, now.AddHours(-6), now.AddHours(-2), "Недоступен в это время."),
        new MeetingParticipantSeed("Созвон с подрядчиком", qaUser.Id, InvitationStatus.Accepted, true, now.AddHours(-8), now.AddHours(-5), null),
        new MeetingParticipantSeed("Созвон с подрядчиком", userUser.Id, InvitationStatus.Accepted, false, now.AddHours(-8), now.AddHours(-4), "Нужен для демонстрации сценария."),
        new MeetingParticipantSeed("Перенос демо для заказчика", analystUser.Id, InvitationStatus.Pending, true, now.AddHours(-10), null, null),
        new MeetingParticipantSeed("Перенос демо для заказчика", supportUser.Id, InvitationStatus.Accepted, false, now.AddHours(-10), now.AddHours(-7), null),
        new MeetingParticipantSeed("Отмененная встреча по аудиту", qaUser.Id, InvitationStatus.Declined, true, now.AddDays(-3), now.AddDays(-2), "Перенос не требуется."),
        new MeetingParticipantSeed("Ретроспектива спринта", userUser.Id, InvitationStatus.Accepted, true, now.AddDays(-5), now.AddDays(-4), "Присутствовал."),
        new MeetingParticipantSeed("Ретроспектива спринта", analystUser.Id, InvitationStatus.Accepted, false, now.AddDays(-5), now.AddDays(-4), null)
    };

    foreach (var seed in participantSeeds)
    {
        var meeting = meetingMap[seed.MeetingTitle];
        var participant = await context.MeetingParticipants
            .FirstOrDefaultAsync(x => x.MeetingId == meeting.Id && x.UserId == seed.UserId);

        if (participant == null)
        {
            context.MeetingParticipants.Add(new MeetingParticipant
            {
                Id = Guid.NewGuid(),
                MeetingId = meeting.Id,
                UserId = seed.UserId,
                InvitationStatus = seed.InvitationStatus,
                IsRequired = seed.IsRequired,
                InvitedAt = seed.InvitedAt,
                ResponseAt = seed.ResponseAt,
                Comment = seed.Comment
            });

            continue;
        }

        participant.InvitationStatus = seed.InvitationStatus;
        participant.IsRequired = seed.IsRequired;
        participant.InvitedAt = seed.InvitedAt;
        participant.ResponseAt = seed.ResponseAt;
        participant.Comment = seed.Comment;
    }

    var fileSeeds = new[]
    {
        new MeetingFileSeed("Планирование релиза Q2", "release-plan-q2.pdf", "/seed-files/release-plan-q2.pdf", "application/pdf", organizerUser.Id, now.AddHours(-2)),
        new MeetingFileSeed("Согласование бюджета проекта", "budget-forecast.xlsx", "/seed-files/budget-forecast.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", adminUser.Id, now.AddHours(-2)),
        new MeetingFileSeed("Созвон с подрядчиком", "vendor-questions.docx", "/seed-files/vendor-questions.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", backupOrganizer.Id, now.AddHours(-1)),
        new MeetingFileSeed("Ретроспектива спринта", "retro-notes.txt", "/seed-files/retro-notes.txt", "text/plain", backupOrganizer.Id, now.AddDays(-1))
    };

    foreach (var seed in fileSeeds)
    {
        var meeting = meetingMap[seed.MeetingTitle];
        var file = await context.MeetingFiles
            .FirstOrDefaultAsync(x => x.MeetingId == meeting.Id && x.FileName == seed.FileName);

        if (file == null)
        {
            context.MeetingFiles.Add(new MeetingFile
            {
                Id = Guid.NewGuid(),
                MeetingId = meeting.Id,
                FileName = seed.FileName,
                FilePath = seed.FilePath,
                FileType = seed.FileType,
                UploadedById = seed.UploadedById,
                UploadedAt = seed.UploadedAt
            });

            continue;
        }

        file.FilePath = seed.FilePath;
        file.FileType = seed.FileType;
        file.UploadedById = seed.UploadedById;
        file.UploadedAt = seed.UploadedAt;
    }

    await context.SaveChangesAsync();
}

async Task ApplyMigrationsWithRetryAsync(
    IServiceScope serviceScope,
    DatabaseContext context,
    IConfiguration configuration,
    ILogger logger)
{
    const int maxAttempts = 10;

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await context.Database.MigrateAsync();
            await SetupInitialDataAsync(serviceScope, configuration, context);
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                ex,
                "Database is not ready yet. Startup attempt {Attempt} of {MaxAttempts} failed. Retrying...",
                attempt,
                maxAttempts);

            await Task.Delay(TimeSpan.FromSeconds(Math.Min(attempt * 2, 15)));
        }
    }

    await context.Database.MigrateAsync();
    await SetupInitialDataAsync(serviceScope, configuration, context);
}

sealed record MeetingSeed(
    string Title,
    string Description,
    Guid OrganizerId,
    MeetingFormat Format,
    MeetingStatus Status,
    DateTime Date,
    DateTime StartTime,
    DateTime EndTime,
    string? Location,
    string? MeetingLink,
    string? ContactInfo);

sealed record MeetingParticipantSeed(
    string MeetingTitle,
    Guid UserId,
    InvitationStatus InvitationStatus,
    bool IsRequired,
    DateTime InvitedAt,
    DateTime? ResponseAt,
    string? Comment);

sealed record MeetingFileSeed(
    string MeetingTitle,
    string FileName,
    string FilePath,
    string FileType,
    Guid UploadedById,
    DateTime UploadedAt);
