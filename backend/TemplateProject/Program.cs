using System.Net;
using AutoMapper;
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
    opt.KnownProxies.Add(IPAddress.Parse("127.0.0.1"));// for localhost
    opt.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("172.16.0.0"), 12));// for docker env
});

builder.Services.AddControllers();

builder.Services.AddAutoMapper(opt =>
{
    opt.AddMaps(typeof(Program).Assembly);
});
builder.Services.AddMediatR(opt =>
{
    opt.RegisterServicesFromAssemblyContaining<Program>();
});
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
    var mapper = serviceProvider.GetRequiredService<IMapper>();
    mapper.ConfigurationProvider.AssertConfigurationIsValid();
    
    var context = serviceProvider.GetRequiredService<DatabaseContext>();

    context.Database.Migrate();
    
    await SetupInitialDataAsync(scope, app.Configuration, context);
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
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/openapi/v1.json", "TemplateProject API V1");
    });
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
    var login = configuration.GetValue<string>("AdminCredentials:Email")!;
    var password = configuration.GetValue<string>("AdminCredentials:Password")!;
    
    var userManager = serviceScope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = serviceScope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
    var adminUser = await userManager.FindByEmailAsync(login);

    if (adminUser != null)
    {
        return;
    }

    adminUser = new User
    {
        UserName = login,
        Email = login,
        EmailConfirmed = true,
    };

    await using var tx = context.Database.BeginTransaction();

    await roleManager.CreateAsync(new Role
    {
        Name = Role.Admin,
    });
    await roleManager.CreateAsync(new Role
    {
        Name = Role.User,
    });
    
    await userManager.CreateAsync(adminUser, password);
    await userManager.AddToRoleAsync(adminUser, Role.Admin);

    await tx.CommitAsync();
}
