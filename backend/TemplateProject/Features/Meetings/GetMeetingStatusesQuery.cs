using MediatR;
using TemplateProject.Common;
using TemplateProject.Domain;

namespace TemplateProject.Features.Meetings;

public class GetMeetingStatusesQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meeting-statuses", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("GetMeetingStatuses")
            .WithOpenApi()
            .WithTags("Meetings")
            .RequireAuthorization(AuthorizationPolicy.ManagementPolicy);
    }

    public record Request : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public List<MeetingStatus> MeetingStatus { get; set; } = [];
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var statuses = Enum.GetValues<MeetingStatus>().ToList();
            return new Response
            {
                MeetingStatus = statuses
            };
        }
    }
}