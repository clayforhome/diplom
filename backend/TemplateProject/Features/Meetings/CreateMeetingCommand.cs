using System.ComponentModel.DataAnnotations;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;
using TemplateProject.Services;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class CreateMeetingCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/meetings", async (
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] CreateMeetingModel model) =>
            {
                return await mediator.Send(new Request(model), cancellationToken);
            })
            .WithName("CreateMeeting")
            .WithTags("Meetings")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record CreateMeetingModel
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public required DateTime Date { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public required MeetingFormat Format { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public string? ContactInfo { get; set; }
        public List<Guid>? ParticipantIds { get; set; }
    }

    public record Request(CreateMeetingModel Model) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public MeetingDto Data { get; set; }
        public string Status { get; set; }
    }

    public class MeetingDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public MeetingFormat Format { get; set; }
        public MeetingStatus Status { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public string? ContactInfo { get; set; }
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
            
            if (request.Model.StartTime >= request.Model.EndTime)
            {
                return ApiErrors.BadRequest.Instance;
            }

            // Validate format requirements
            if (request.Model.Format == MeetingFormat.Offline && string.IsNullOrWhiteSpace(request.Model.Location))
            {
                return ApiErrors.BadRequest.Instance;
            }

            if (request.Model.Format == MeetingFormat.Online && string.IsNullOrWhiteSpace(request.Model.MeetingLink))
            {
                return ApiErrors.BadRequest.Instance;
            }

            if (request.Model.Format == MeetingFormat.Hybrid && 
                (string.IsNullOrWhiteSpace(request.Model.Location) || string.IsNullOrWhiteSpace(request.Model.MeetingLink)))
            {
                return ApiErrors.BadRequest.Instance;
            }

            if (request.Model.Format == MeetingFormat.Phone && string.IsNullOrWhiteSpace(request.Model.ContactInfo))
            {
                return ApiErrors.BadRequest.Instance;
            }

            var now = _timeProvider.GetUtcNow().UtcDateTime;
            var meeting = new Meeting
            {
                Id = Guid.NewGuid(),
                Title = request.Model.Title,
                Description = request.Model.Description,
                Date = request.Model.Date,
                StartTime = request.Model.StartTime,
                EndTime = request.Model.EndTime,
                OrganizerId = userId!.Value,
                Format = request.Model.Format,
                Status = MeetingStatus.Draft,
                Location = request.Model.Location,
                MeetingLink = request.Model.MeetingLink,
                ContactInfo = request.Model.ContactInfo,
                IsDeleted = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Meetings.Add(meeting);

            // Add participants if provided
            if (request.Model.ParticipantIds?.Any() == true)
            {
                foreach (var participantId in request.Model.ParticipantIds.Distinct())
                {
                    var participant = new MeetingParticipant
                    {
                        Id = Guid.NewGuid(),
                        MeetingId = meeting.Id,
                        UserId = participantId,
                        InvitationStatus = InvitationStatus.Pending,
                        IsRequired = false,
                        InvitedAt = now
                    };
                    _context.MeetingParticipants.Add(participant);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            var dto = new MeetingDto
            {
                Id = meeting.Id,
                Title = meeting.Title,
                Description = meeting.Description,
                Date = meeting.Date,
                StartTime = meeting.StartTime,
                EndTime = meeting.EndTime,
                Format = meeting.Format,
                Status = meeting.Status,
                Location = meeting.Location,
                MeetingLink = meeting.MeetingLink,
                ContactInfo = meeting.ContactInfo
            };

            return new Response { Data = dto, Status = "Ok" };
        }
    }
}

