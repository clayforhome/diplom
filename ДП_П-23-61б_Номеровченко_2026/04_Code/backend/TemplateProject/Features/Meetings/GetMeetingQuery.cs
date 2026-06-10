using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class GetMeetingQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meetings/{id:guid}", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id), cancellationToken);
            })
            .WithName("GetMeeting")
            .WithTags("Meetings")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid Id) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public MeetingModel Data { get; set; }
        public string Status { get; set; }
    }

    public class MeetingModel
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
        public Guid OrganizerId { get; set; }
        public int ParticipantCount { get; set; }
        public int FileCount { get; set; }
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
            var meeting = await _context.Meetings
                .Where(m => !m.IsDeleted)
                .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var participantCount = await _context.MeetingParticipants
                .CountAsync(mp => mp.MeetingId == request.Id, cancellationToken);

            var fileCount = await _context.MeetingFiles
                .CountAsync(mf => mf.MeetingId == request.Id, cancellationToken);

            var dto = new MeetingModel
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
                ContactInfo = meeting.ContactInfo,
                OrganizerId = meeting.OrganizerId,
                ParticipantCount = participantCount,
                FileCount = fileCount
            };

            return new Response { Data = dto, Status = "Ok" };
        }
    }
}

