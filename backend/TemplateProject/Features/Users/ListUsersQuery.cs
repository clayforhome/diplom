using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Users;

[PublicAPI]
public class ListUsersQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/users", async (
                [FromQuery] int page,
                [FromQuery] int limit,
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(page, limit), cancellationToken);
            })
            .WithName("ListUsers")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization("AdminOnly");
    }

    public record Request(int Page, int Limit) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public PaginatedResult Data { get; set; }
        public string Status { get; set; }
    }

    public class PaginatedResult
    {
        public List<UserDto> Items { get; set; } = [];
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public int? Age { get; set; }
        public bool EmailConfirmed { get; set; }
        public DateTime? RegistrationDate { get; set; }
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
            var query = _context.Users;

            var total = await query.CountAsync(cancellationToken);

            var skip = (request.Page - 1) * request.Limit;
            var users = await query
                .OrderByDescending(u => u.RegistrationDate)
                .Skip(skip)
                .Take(request.Limit)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    Name = u.Name,
                    Age = u.Age,
                    EmailConfirmed = u.EmailConfirmed,
                    RegistrationDate = u.RegistrationDate
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

