using System.ComponentModel.DataAnnotations;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateProject.Common;
using TemplateProject.Services;

namespace TemplateProject.Features.User;

[PublicAPI]
public class ResetPasswordCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/auth/reset-password", async (
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] ResetPasswordRequest request) =>
            {
                return await mediator.Send(new Request(
                    request.UserId,
                    request.NewPassword), cancellationToken);
            })
            .WithName("ResetPassword")
            .WithTags("Auth")
            .WithOpenApi()
            .RequireAuthorization("AdminOnly");
    }

    public class ResetPasswordRequest
    {
        [Required]
        public Guid UserId { get; set; }
        
        [Required(AllowEmptyStrings = false)]
        public string NewPassword { get; set; }
    }

    public record Request(Guid UserId, string NewPassword) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public PasswordResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class PasswordResponseData
    {
        public string Message { get; set; } = "Password reset successfully";
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

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
            {
                return ApiErrors.BadRequest.Instance;
            }

            return new Response { Data = new PasswordResponseData(), Status = "Ok" };
        }
    }
}


