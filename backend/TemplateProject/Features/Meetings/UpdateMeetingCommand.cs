using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;
using TemplateProject.Services;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class UpdateMeetingCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPatch("/api/v1/meetings/{id:guid}", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] UpdateMeetingRequest model) =>
            {
                return await mediator.Send(new Request(id, model), cancellationToken);
            })
            .WithName("UpdateMeeting")
            .WithTags("Meetings")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public class UpdateMeetingRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public MeetingFormat? Format { get; set; }
        public MeetingStatus? Status { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public string? ContactInfo { get; set; }
    }

    public record Request(Guid Id, UpdateMeetingRequest Model) : IRequest<BaseApiResponse<Response>>;

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
            var isAdmin = string.Equals(_currentUserProvider.GetRole(), Role.Admin, StringComparison.Ordinal);

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(m => m.Id == request.Id && !m.IsDeleted, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (!isAdmin && meeting.OrganizerId != userId)
            {
                return ApiErrors.Forbidden.Instance;
            }

            var newStatus = request.Model.Status;

            // Check time validation if both times are provided or updating only one
            if ((request.Model.StartTime.HasValue || request.Model.EndTime.HasValue))
            {
                var startTime = request.Model.StartTime ?? meeting.StartTime;
                var endTime = request.Model.EndTime ?? meeting.EndTime;

                if (startTime >= endTime)
                {
                    return ApiErrors.BadRequest.Instance;
                }

                // If time changed, automatically set status to RESCHEDULED
                if (request.Model.StartTime.HasValue || request.Model.EndTime.HasValue || request.Model.Date.HasValue)
                {
                    if (newStatus == null && meeting.Status == MeetingStatus.Scheduled)
                    {
                        newStatus = MeetingStatus.Rescheduled;
                    }
                }
            }

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(request.Model.Title))
                meeting.Title = request.Model.Title;

            if (request.Model.Description != null)
                meeting.Description = request.Model.Description;

            if (request.Model.Date.HasValue)
                meeting.Date = request.Model.Date.Value;

            if (request.Model.StartTime.HasValue)
                meeting.StartTime = request.Model.StartTime.Value;

            if (request.Model.EndTime.HasValue)
                meeting.EndTime = request.Model.EndTime.Value;

            if (request.Model.Format.HasValue)
            {
                meeting.Format = request.Model.Format.Value;
                
                // Validate format requirements
                if (request.Model.Format.Value == MeetingFormat.Offline && string.IsNullOrWhiteSpace(request.Model.Location ?? meeting.Location))
                    return ApiErrors.BadRequest.Instance;

                if (request.Model.Format.Value == MeetingFormat.Online && string.IsNullOrWhiteSpace(request.Model.MeetingLink ?? meeting.MeetingLink))
                    return ApiErrors.BadRequest.Instance;

                if (request.Model.Format.Value == MeetingFormat.Hybrid && 
                    (string.IsNullOrWhiteSpace(request.Model.Location ?? meeting.Location) || 
                     string.IsNullOrWhiteSpace(request.Model.MeetingLink ?? meeting.MeetingLink)))
                    return ApiErrors.BadRequest.Instance;

                if (request.Model.Format.Value == MeetingFormat.Phone && string.IsNullOrWhiteSpace(request.Model.ContactInfo ?? meeting.ContactInfo))
                    return ApiErrors.BadRequest.Instance;
            }

            if (newStatus.HasValue)
                meeting.Status = newStatus.Value;

            if (request.Model.Location != null)
                meeting.Location = request.Model.Location;

            if (request.Model.MeetingLink != null)
                meeting.MeetingLink = request.Model.MeetingLink;

            if (request.Model.ContactInfo != null)
                meeting.ContactInfo = request.Model.ContactInfo;

            meeting.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;

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

