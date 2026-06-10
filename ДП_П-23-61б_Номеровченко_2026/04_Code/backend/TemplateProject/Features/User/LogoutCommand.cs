using JetBrains.Annotations;
using MediatR;
using TemplateProject.Common;
using TemplateProject.Services;

namespace TemplateProject.Features.User;

[PublicAPI]
public class LogoutCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/auth/logout", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("Logout")
            .WithTags("Auth")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public MediatR.Unit Data { get; set; }
        public string Status { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly CurrentUserProvider _currentUserProvider;

        public Handler(CurrentUserProvider currentUserProvider)
        {
            _currentUserProvider = currentUserProvider;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            // JWT tokens are stateless, so logout on client-side is sufficient
            // In a production app, you might want to maintain a token blacklist
            return await Task.FromResult(new Response { Data = MediatR.Unit.Value, Status = "Ok" });
        }
    }
}


