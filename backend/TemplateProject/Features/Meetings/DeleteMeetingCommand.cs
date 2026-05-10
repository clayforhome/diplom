using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class DeleteMeetingCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapDelete("/api/v1/meetings/{id:guid}", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id), cancellationToken);
            })
            .WithName("DeleteMeeting")
            .WithTags("Meetings")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid Id) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public string Status { get; set; }
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
            var userId = _currentUserProvider.GetCurrentUserId();

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(m => m.Id == request.Id && !m.IsDeleted, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (meeting.OrganizerId != userId)
            {
                return ApiErrors.Forbidden.Instance;
            }

            meeting.IsDeleted = true;
            meeting.DeletedAt = _timeProvider.GetUtcNow().UtcDateTime;
            meeting.DeletedBy = userId;
            meeting.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response { Status = "Ok" };
        }
    }
}



