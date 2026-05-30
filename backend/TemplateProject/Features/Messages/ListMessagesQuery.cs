using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Messages;

[PublicAPI]
public class ListMessagesQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/messages", async (
                [FromQuery] int page,
                [FromQuery] int limit,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(page, limit), cancellationToken);
            })
            .WithName("ListMessages")
            .WithTags("Messages")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.ManagementPolicy);
    }

    public record Request(int Page, int Limit) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public PaginatedResult Data { get; set; }
        public string Status { get; set; }
    }

    public class PaginatedResult
    {
        public List<MessageDto> Items { get; set; } = [];
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class MessageDto
    {
        public Guid Id { get; set; }
        public required string RecipientName { get; set; }
        public required string RecipientEmail { get; set; }
        public required string Subject { get; set; }
        public required string Body { get; set; }
        public DateTime SentAt { get; set; }
        public Guid? MeetingId { get; set; }
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
            var currentUserId = _currentUserProvider.GetCurrentUserId();
            if (currentUserId == null)
            {
                return ApiErrors.Unauthorized.Instance;
            }

            var query = _context.Messages
                .Include(m => m.Recipient);

            var total = await query.CountAsync(cancellationToken);

            var skip = (request.Page - 1) * request.Limit;
            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Skip(skip)
                .Take(request.Limit)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    RecipientName = m.Recipient.Name,
                    RecipientEmail = m.Recipient.Email!,
                    Subject = m.Subject,
                    Body = m.Body,
                    SentAt = m.SentAt,
                    MeetingId = m.MeetingId
                })
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult
            {
                Items = messages,
                Total = total,
                Page = request.Page,
                PageSize = request.Limit
            };

            return new Response { Data = result, Status = "Ok" };
        }
    }
}

