using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class CheckAvailabilityQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/meetings/availability", async (
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] CheckAvailabilityModel model) =>
            {
                return await mediator.Send(new Request(model), cancellationToken);
            })
            .WithName("CheckAvailability")
            .WithTags("Meetings")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record CheckAvailabilityModel
    {
        public required List<Guid> ParticipantIds { get; set; }
        public required DateTime Date { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
    }

    public record Request(CheckAvailabilityModel QueryModel) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public AvailabilityResult Data { get; set; }
        public string Status { get; set; }
    }

    public record AvailabilityResult
    {
        public bool AllAvailable { get; set; }
        public List<ConflictInfo> Conflicts { get; set; } = [];
    }

    public record ConflictInfo
    {
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public Guid ConflictingMeetingId { get; set; }
        public string ConflictingMeetingTitle { get; set; }
        public DateTime ConflictStartTime { get; set; }
        public DateTime ConflictEndTime { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly DatabaseContext _context;

        public Handler(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            if (request.QueryModel.StartTime >= request.QueryModel.EndTime)
            {
                return ApiErrors.BadRequest.Instance;
            }

            var conflicts = new List<ConflictInfo>();

            // Check each participant
            foreach (var participantId in request.QueryModel.ParticipantIds.Distinct())
            {
                // Find all meetings for this participant that overlap with the requested time
                var conflictingMeetings = await _context.MeetingParticipants
                    .Include(mp => mp.Meeting)
                    .Where(mp => mp.UserId == participantId)
                    .Where(mp => mp.Meeting != null && !mp.Meeting.IsDeleted)
                    .Where(mp => mp.Meeting!.Status != MeetingStatus.Cancelled && 
                                 mp.Meeting.Status != MeetingStatus.Draft)
                    .Where(mp => mp.Meeting!.Date == request.QueryModel.Date)
                    .Where(mp => request.QueryModel.StartTime < mp.Meeting!.EndTime && request.QueryModel.EndTime > mp.Meeting.StartTime)
                    .Select(mp => new { mp.Meeting, mp.User })
                    .ToListAsync(cancellationToken);

                // Also check organizer's own meetings
                var organizerConflicts = await _context.Meetings
                    .Where(m => m.OrganizerId == participantId)
                    .Where(m => !m.IsDeleted)
                    .Where(m => m.Status != MeetingStatus.Cancelled && 
                                m.Status != MeetingStatus.Draft)
                    .Where(m => m.Date == request.QueryModel.Date)
                    .Where(m => request.QueryModel.StartTime < m.EndTime && request.QueryModel.EndTime > m.StartTime)
                    .ToListAsync(cancellationToken);

                // Add conflicts from participants
                foreach (var conflict in conflictingMeetings)
                {
                    conflicts.Add(new ConflictInfo
                    {
                        UserId = participantId,
                        UserName = conflict.User?.UserName,
                        ConflictingMeetingId = conflict.Meeting!.Id,
                        ConflictingMeetingTitle = conflict.Meeting.Title,
                        ConflictStartTime = conflict.Meeting.StartTime,
                        ConflictEndTime = conflict.Meeting.EndTime
                    });
                }

                // Add conflicts from organizer meetings
                foreach (var conflict in organizerConflicts)
                {
                    conflicts.Add(new ConflictInfo
                    {
                        UserId = participantId,
                        UserName = (await _context.Users.FirstOrDefaultAsync(u => u.Id == participantId, cancellationToken))?.UserName,
                        ConflictingMeetingId = conflict.Id,
                        ConflictingMeetingTitle = conflict.Title,
                        ConflictStartTime = conflict.StartTime,
                        ConflictEndTime = conflict.EndTime
                    });
                }
            }

            var result = new AvailabilityResult
            {
                AllAvailable = conflicts.Count == 0,
                Conflicts = conflicts
            };

            return new Response { Data = result, Status = "Ok" };
        }
    }
}

