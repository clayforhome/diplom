using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class GetUserQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/users", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("GetCurrentUser")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public UserDto Data { get; set; }
        public string Status { get; set; }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public int? Age { get; set; }
        public bool EmailConfirmed { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public List<string> Roles { get; set; } = [];
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly DatabaseContext _context;
        private readonly CurrentUserProvider _currentUserProvider;

        public Handler(DatabaseContext context, CurrentUserProvider currentUserProvider)
        {
            _context = context;
            _currentUserProvider = currentUserProvider;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var userId = _currentUserProvider.GetCurrentUserId();

            if (userId == null)
            {
                return ApiErrors.Unauthorized.Instance;
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var roles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.Name)
                .ToListAsync(cancellationToken);

            var dto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Name = user.Name,
                Age = user.Age,
                EmailConfirmed = user.EmailConfirmed,
                RegistrationDate = user.RegistrationDate,
                Roles = roles.Where(r => !string.IsNullOrEmpty(r)).Cast<string>().ToList()
            };

            return new Response { Data = dto, Status = "Ok" };
        }
    }
}

