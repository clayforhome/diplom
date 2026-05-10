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
using Microsoft.OpenApi.Models;
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

builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));

builder.Services.AddAuthorizationBuilder()
    .AddDefaultPolicy(AuthorizationPolicy.UserPolicy, policy => policy.RequireAuthenticatedUser())
    .AddPolicy(AuthorizationPolicy.OnlyAdminPolicy, policy => policy.RequireRole(Role.Admin))
    .AddPolicy(AuthorizationPolicy.OrganizerPolicy, policy => policy.RequireRole(Role.Organizer))
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

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors(c =>
        c.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
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

    var userManager = serviceScope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = serviceScope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

    await EnsureRoleExistsAsync(roleManager, Role.Admin);
    await EnsureRoleExistsAsync(roleManager, Role.User);
    await EnsureRoleExistsAsync(roleManager, Role.Organizer);

    var adminUser = await EnsureUserAsync(userManager, adminLogin, adminPassword);
    var userUser = await EnsureUserAsync(userManager, userLogin, userPassword);
    var organizerUser = await EnsureUserAsync(userManager, organizerLogin, organizerPassword);

    await EnsureOnlyRolesAsync(userManager, adminUser, [Role.Admin]);
    await EnsureOnlyRolesAsync(userManager, userUser, [Role.User]);
    await EnsureOnlyRolesAsync(userManager, organizerUser, [Role.Organizer]);
}

async Task EnsureRoleExistsAsync(RoleManager<Role> roleManager, string roleName)
{
    if (await roleManager.RoleExistsAsync(roleName))
    {
        return;
    }

    await roleManager.CreateAsync(new Role
    {
        Name = roleName,
    });
}

async Task<User> EnsureUserAsync(UserManager<User> userManager, string email, string password)
{
    var user = await userManager.FindByEmailAsync(email);

    if (user != null)
    {
        return user;
    }

    user = new User
    {
        UserName = email,
        Email = email,
        EmailConfirmed = true,
    };

    await userManager.CreateAsync(user, password);
    return user;
}

async Task EnsureOnlyRolesAsync(UserManager<User> userManager, User user, IEnumerable<string> expectedRoles)
{
    var currentRoles = await userManager.GetRolesAsync(user);
    var expectedRoleSet = expectedRoles.ToHashSet(StringComparer.Ordinal);
    var rolesToRemove = currentRoles.Where(role => !expectedRoleSet.Contains(role)).ToArray();

    if (rolesToRemove.Length > 0)
    {
        await userManager.RemoveFromRolesAsync(user, rolesToRemove);
    }

    foreach (var role in expectedRoleSet)
    {
        if (!currentRoles.Contains(role, StringComparer.Ordinal))
        {
            await userManager.AddToRoleAsync(user, role);
        }
    }
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
