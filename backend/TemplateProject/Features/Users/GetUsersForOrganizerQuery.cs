using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Users;

public class GetUsersForOrganizerQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/organizer/users", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("GetUsersForOrganizer")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.ManagementPolicy);
    }

    public record Request : IRequest<BaseApiResponse<Response>>
    {
    }

    public record Response
    {
        public List<UserModel> Users { get; set; } = [];
    }

    public record UserModel
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly DatabaseContext _context;

        public Handler(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var users = await _context.Users
                .Where(x => x.IsDeleted == false)
                .Select(x => new UserModel()
                {
                    Id = x.Id,
                    Email = x.Email!,
                    Name = x.Name!
                })
                .ToListAsync(cancellationToken);

            return new Response()
            {
                Users = users
            };
        }
    }
}