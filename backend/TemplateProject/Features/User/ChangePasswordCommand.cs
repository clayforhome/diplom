using System.ComponentModel.DataAnnotations;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateProject.Common;
using TemplateProject.Services;

namespace TemplateProject.Features.User;

[PublicAPI]
public class ChangePasswordCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/auth/change-password", async (
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] ChangePasswordRequest request) =>
            {
                return await mediator.Send(new Request(request), cancellationToken);
            })
            .WithName("ChangePassword")
            .WithTags("Auth")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public class ChangePasswordRequest
    {
        [Required(AllowEmptyStrings = false)]
        public string OldPassword { get; set; }
        
        [Required(AllowEmptyStrings = false)]
        public string NewPassword { get; set; }
    }

    public record Request(ChangePasswordRequest Model) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public string Data { get; set; }
        public string Status { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly UserManager<Domain.User> _userManager;
        private readonly CurrentUserProvider _currentUserProvider;

        public Handler(UserManager<Domain.User> userManager, CurrentUserProvider currentUserProvider)
        {
            _userManager = userManager;
            _currentUserProvider = currentUserProvider;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var userId = _currentUserProvider.GetCurrentUserId();
            
            if (userId == null)
            {
                return ApiErrors.Unauthorized.Instance;
            }
            
            var user = await _userManager.FindByIdAsync(userId.Value.ToString());

            if (user == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var result = await _userManager.ChangePasswordAsync(user, request.Model.OldPassword, request.Model.NewPassword);

            if (!result.Succeeded)
            {
                return ApiErrors.BadRequest.Instance;
            }

            return new Response { Data = "Password changed successfully", Status = "Ok" };
        }
    }
}


