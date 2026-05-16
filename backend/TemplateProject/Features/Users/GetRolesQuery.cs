using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class GetRolesQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/roles", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("GetRoles")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.OnlyAdminPolicy);
    }

    public record Request : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public GetRolesResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class GetRolesResponseData
    {
        public List<string> Roles { get; set; } = [];
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
            var roles = await _context.Roles
                .Select(r => r.Name!)
                .OrderBy(r => r)
                .ToListAsync(cancellationToken);

            return new Response
            {
                Data = new GetRolesResponseData { Roles = roles },
                Status = "Ok"
            };
        }
    }
}