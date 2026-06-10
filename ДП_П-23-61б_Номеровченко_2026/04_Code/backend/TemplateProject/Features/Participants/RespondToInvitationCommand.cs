using System.ComponentModel.DataAnnotations;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;
using TemplateProject.Services;

namespace TemplateProject.Features.Participants;

[PublicAPI]
public class RespondToInvitationCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPatch("/api/v1/meetings/{id:guid}/participants/{userId:guid}/respond", async (
                Guid id,
                Guid userId,
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] RespondToInvitationModel model) =>
            {
                return await mediator.Send(new Request(id, userId, model), cancellationToken);
            })
            .WithName("RespondToInvitation")
            .WithTags("Participants")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record RespondToInvitationModel 
    {
        [Required]
        public required InvitationStatus Status { get; set; }
        public string? Comment { get; set; }
    }

    public record Request(Guid MeetingId, Guid UserId, RespondToInvitationModel Model) : IRequest<BaseApiResponse<Response>>;
    
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
            var currentUserId = _currentUserProvider.GetCurrentUserId();

            // Only the invited user can respond
            if (request.UserId != currentUserId)
            {
                return ApiErrors.Forbidden.Instance;
            }

            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(mp => mp.MeetingId == request.MeetingId && mp.UserId == request.UserId, cancellationToken);

            if (participant == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            participant.InvitationStatus = request.Model.Status;
            participant.ResponseAt = _timeProvider.GetUtcNow().UtcDateTime;
            participant.Comment = request.Model.Comment;

            // Check if all required participants have responded with ACCEPTED
            var meeting = await _context.Meetings
                .Include(m => m.Participants)
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId, cancellationToken);

            if (meeting != null)
            {
                var allAccepted = !meeting.Participants
                    .Any(p => p.IsRequired && p.InvitationStatus != InvitationStatus.Accepted);

                if (allAccepted && meeting.Status == MeetingStatus.AwaitingConfirmation)
                {
                    meeting.Status = MeetingStatus.Confirmed;
                    meeting.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            return new Response { Status = "Ok" };
        }
    }
}


