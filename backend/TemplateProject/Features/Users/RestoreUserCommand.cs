using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class RestoreUserCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPatch("/api/v1/users/{id:guid}/restore", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id), cancellationToken);
            })
            .WithName("RestoreUser")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.OnlyAdminPolicy);
    }

    public record Request(Guid UserId) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public RestoreUserResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class RestoreUserResponseData
    {
        public string Message { get; set; } = "User restored successfully";
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly DatabaseContext _context;
        private readonly CurrentUserProvider _currentUserProvider;
        private readonly TimeProvider _timeProvider;

        public Handler(DatabaseContext context, CurrentUserProvider currentUserProvider, TimeProvider timeProvider)
        {
            _context = context;
            _currentUserProvider = currentUserProvider;
            _timeProvider = timeProvider;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserProvider.GetCurrentUserId();
            if (currentUserId == null)
            {
                return ApiErrors.Unauthorized.Instance;
            }

            var user = await _context.Users.FindAsync([request.UserId], cancellationToken);

            if (user == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (!user.IsDeleted)
            {
                return new ApiErrors.ValidationError("User is not deleted");
            }

            // Восстановить пользователя
            user.IsDeleted = false;
            user.DeletedAt = null;
            user.DeletedBy = null;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response
            {
                Data = new RestoreUserResponseData(),
                Status = "Ok"
            };
        }
    }
}

