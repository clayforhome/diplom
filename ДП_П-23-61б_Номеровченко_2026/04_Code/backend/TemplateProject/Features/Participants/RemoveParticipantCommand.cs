using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Participants;

[PublicAPI]
public class RemoveParticipantCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapDelete("/api/v1/meetings/{id:guid}/participants/{userId:guid}", async (
                Guid id,
                Guid userId,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id, userId), cancellationToken);
            })
            .WithName("RemoveParticipant")
            .WithTags("Participants")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid MeetingId, Guid UserId) : IRequest<BaseApiResponse<Response>>;

    public class Response
    {
        public string Status { get; set; }
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

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId && !m.IsDeleted, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (meeting.OrganizerId != userId)
            {
                return ApiErrors.Forbidden.Instance;
            }

            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(mp => mp.MeetingId == request.MeetingId && mp.UserId == request.UserId, cancellationToken);

            if (participant == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            _context.MeetingParticipants.Remove(participant);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response { Status = "Ok" };
        }
    }
}



