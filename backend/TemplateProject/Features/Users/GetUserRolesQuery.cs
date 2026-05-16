using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class GetUserRolesQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/users/{id:guid}/roles", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id), cancellationToken);
            })
            .WithName("GetUserRoles")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.OnlyAdminPolicy);
    }

    public record Request(Guid UserId) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public GetUserRolesResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class GetUserRolesResponseData
    {
        public List<string> Roles { get; set; } = [];
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly UserManager<Domain.User> _userManager;

        public Handler(UserManager<Domain.User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());

            if (user == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new Response
            {
                Data = new GetUserRolesResponseData { Roles = roles.ToList() },
                Status = "Ok"
            };
        }
    }
}

