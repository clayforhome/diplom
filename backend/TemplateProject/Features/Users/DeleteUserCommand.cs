using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;
using TemplateProject.Services;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class DeleteUserCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapDelete("/api/v1/users/{id:guid}", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id), cancellationToken);
            })
            .WithName("DeleteUser")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization("AdminOnly");
    }

    public record Request(Guid UserId) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public MediatR.Unit Data { get; set; }
        public string Status { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly DatabaseContext _context;
        private readonly UserManager<Domain.User> _userManager;
        private readonly CurrentUserProvider _currentUserProvider;

        public Handler(DatabaseContext context, UserManager<Domain.User> userManager, CurrentUserProvider currentUserProvider)
        {
            _context = context;
            _userManager = userManager;
            _currentUserProvider = currentUserProvider;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserProvider.GetCurrentUserId();

            if (currentUserId == request.UserId)
            {
                return new ApiErrors.ValidationError("Cannot delete the current admin account.");
            }

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());

            if (user == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var hasOrganizedMeetings = await _context.Meetings
                .AnyAsync(m => m.OrganizerId == request.UserId && !m.IsDeleted, cancellationToken);

            if (hasOrganizedMeetings)
            {
                return new ApiErrors.ValidationError("User cannot be deleted while active meetings are assigned to them as organizer.");
            }

            var hasUploadedFiles = await _context.MeetingFiles
                .AnyAsync(mf => mf.UploadedById == request.UserId, cancellationToken);

            if (hasUploadedFiles)
            {
                return new ApiErrors.ValidationError("User cannot be deleted while uploaded files are linked to the account.");
            }

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
            {
                return new ApiErrors.ValidationError(result.Errors.Select(error => error.Description).ToArray());
            }

            return new Response { Data = MediatR.Unit.Value, Status = "Ok" };
        }
    }
}
