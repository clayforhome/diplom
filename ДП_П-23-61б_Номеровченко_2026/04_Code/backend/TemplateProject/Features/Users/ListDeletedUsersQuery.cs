using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class ListDeletedUsersQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/users/deleted", async (
                [FromQuery] int page,
                [FromQuery] int limit,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(page, limit), cancellationToken);
            })
            .WithName("ListDeletedUsers")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.OnlyAdminPolicy);
    }

    public record Request(int Page, int Limit) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public PaginatedResult Data { get; set; }
        public string Status { get; set; }
    }

    public class PaginatedResult
    {
        public List<DeletedUserDto> Items { get; set; } = [];
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class DeletedUserDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public int? Age { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedByName { get; set; }
        public Guid? DeletedBy { get; set; }
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
            
            var currentUser = await _context.Users.FindAsync([currentUserId], cancellationToken);
            
            var query = _context.Users
                .Where(u => u.IsDeleted);

            var total = await query.CountAsync(cancellationToken);

            var skip = (request.Page - 1) * request.Limit;
            var users = await query
                .OrderByDescending(u => u.DeletedAt)
                .Skip(skip)
                .Take(request.Limit)
                .Select(u => new DeletedUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    Age = u.Age,
                    Name = u.Name,
                    DeletedAt = u.DeletedAt,
                    DeletedBy = u.DeletedBy,
                    DeletedByName = currentUser!.Name
                })
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult
            {
                Items = users,
                Total = total,
                Page = request.Page,
                PageSize = request.Limit
            };

            return new Response { Data = result, Status = "Ok" };
        }
    }
}

