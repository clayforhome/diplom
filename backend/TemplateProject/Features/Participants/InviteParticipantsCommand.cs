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
public class InviteParticipantsCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/meetings/{id:guid}/participants", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] InviteParticipantsModel model) =>
            {
                return await mediator.Send(new Request(id, model), cancellationToken);
            })
            .WithName("InviteParticipants")
            .WithTags("Participants")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record InviteParticipantsModel
    {
        [Required]
        public required List<Guid> ParticipantIds { get; set; }
    }

    public record Request(Guid MeetingId, InviteParticipantsModel Model) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public MediatR.Unit Data { get; set; }
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
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId && !m.IsDeleted, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (meeting.OrganizerId != userId)
            {
                return ApiErrors.Forbidden.Instance;
            }

            var now = _timeProvider.GetUtcNow().UtcDateTime;

            foreach (var participantId in request.Model.ParticipantIds.Distinct())
            {
                // Check if already invited
                var existing = await _context.MeetingParticipants
                    .FirstOrDefaultAsync(mp => mp.MeetingId == request.MeetingId && mp.UserId == participantId, cancellationToken);

                if (existing != null)
                    continue;

                var participant = new MeetingParticipant
                {
                    Id = Guid.NewGuid(),
                    MeetingId = request.MeetingId,
                    UserId = participantId,
                    InvitationStatus = InvitationStatus.Pending,
                    IsRequired = false,
                    InvitedAt = now
                };

                _context.MeetingParticipants.Add(participant);
            }

            await _context.SaveChangesAsync(cancellationToken);

            return new Response { Data = MediatR.Unit.Value, Status = "Ok" };
        }
    }
}



