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
public class ListMeetingsQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meetings", async (
                [FromQuery] MeetingStatus? status,
                [FromQuery] int page,
                [FromQuery] int limit,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(status, page, limit), cancellationToken);
            })
            .WithName("ListMeetings")
            .WithTags("Meetings")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(MeetingStatus? Status, int Page, int Limit) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public PaginatedResult Data { get; set; }
        public string Status { get; set; }
    }

    public class PaginatedResult
    {
        public List<MeetingModel> Items { get; set; } = [];
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
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
        public Guid OrganizerId { get; set; }
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
            
            var usersRole = await _context.Users
                .Where(x => x.Id == userId)
                .Include(x => x.UserRoles)
                .ThenInclude(x => x.Role)
                .SingleAsync(cancellationToken);
            
            var isAdmin = string.Equals(usersRole.UserRoles[0].Role.Name, Role.Admin, StringComparison.Ordinal);

            var query = _context.Meetings
                .Where(m => !m.IsDeleted);

            if (!isAdmin)
            {
                query = query.Where(m => m.OrganizerId == userId ||
                                         _context.MeetingParticipants.Any(mp => mp.MeetingId == m.Id && mp.UserId == userId));
            }

            if (request.Status.HasValue)
            {
                query = query.Where(m => m.Status == request.Status.Value);
            }

            var total = await query.CountAsync(cancellationToken);

            var skip = (request.Page - 1) * request.Limit;
            var meetings = await query
                .OrderByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Take(request.Limit)
                .Select(m => new MeetingModel
                {
                    Id = m.Id,
                    Title = m.Title,
                    Description = m.Description,
                    Date = m.Date,
                    StartTime = m.StartTime.ToUniversalTime(),
                    EndTime = m.EndTime.ToUniversalTime(),
                    Format = m.Format,
                    Status = m.Status,
                    OrganizerId = m.OrganizerId
                })
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult
            {
                Items = meetings,
                Total = total,
                Page = request.Page,
                PageSize = request.Limit
            };

            return new Response { Data = result, Status = "Ok" };
        }
    }
}

