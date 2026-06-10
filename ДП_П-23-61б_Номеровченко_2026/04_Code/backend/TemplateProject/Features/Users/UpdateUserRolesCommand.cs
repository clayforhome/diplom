using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class UpdateUserRolesCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPatch("/api/v1/users/{id:guid}/roles", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] UpdateUserRolesModel model) =>
            {
                return await mediator.Send(new Request(id, model), cancellationToken);
            })
            .WithName("UpdateUserRoles")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.OnlyAdminPolicy);
    }

    public record UpdateUserRolesModel
    {
        public required List<string> Roles { get; set; }
    }

    public record Request(Guid UserId, UpdateUserRolesModel Model) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public UpdateUserRolesResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class UpdateUserRolesResponseData
    {
        public string Message { get; set; } = "Roles updated successfully";
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

            var currentRoles = await _userManager.GetRolesAsync(user);
            var rolesToAdd = request.Model.Roles.Except(currentRoles).ToList();
            var rolesToRemove = currentRoles.Except(request.Model.Roles).ToList();

            if (rolesToAdd.Count > 0)
            {
                var result = await _userManager.AddToRolesAsync(user, rolesToAdd);
                if (!result.Succeeded)
                {
                    return ApiErrors.BadRequest.Instance;
                }
            }

            if (rolesToRemove.Count > 0)
            {
                var result = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
                if (!result.Succeeded)
                {
                    return ApiErrors.BadRequest.Instance;
                }
            }

            return new Response
            {
                Data = new UpdateUserRolesResponseData(),
                Status = "Ok"
            };
        }
    }
}

