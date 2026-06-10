using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;

namespace TemplateProject.Features.Participants;

[PublicAPI]
public class ListParticipantsQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meetings/{id:guid}/participants", async (
                Guid id,
                [FromQuery] InvitationStatus? status,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(id, status), cancellationToken);
            })
            .WithName("ListParticipants")
            .WithTags("Participants")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid MeetingId, InvitationStatus? Status) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public List<ParticipantModel> Data { get; set; }
        public string Status { get; set; }
    }

    public class ParticipantModel
    {
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public InvitationStatus InvitationStatus { get; set; }
        public bool IsRequired { get; set; }
        public DateTime InvitedAt { get; set; }
        public DateTime? ResponseAt { get; set; }
        public string? Comment { get; set; }
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
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId && !m.IsDeleted, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var query = _context.MeetingParticipants
                .Where(mp => mp.MeetingId == request.MeetingId);

            if (request.Status.HasValue)
            {
                query = query.Where(mp => mp.InvitationStatus == request.Status.Value);
            }

            var participants = await query
                .Select(mp => new ParticipantModel
                {
                    UserId = mp.UserId,
                    UserName = mp.User.UserName,
                    Email = mp.User.Email,
                    InvitationStatus = mp.InvitationStatus,
                    IsRequired = mp.IsRequired,
                    InvitedAt = mp.InvitedAt,
                    ResponseAt = mp.ResponseAt,
                    Comment = mp.Comment
                })
                .OrderByDescending(p => p.InvitedAt)
                .ToListAsync(cancellationToken);

            return new Response { Data = participants, Status = "Ok" };
        }
    }
}

