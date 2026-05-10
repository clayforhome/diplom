using MediatR;
using TemplateProject.Common;
using TemplateProject.Domain;

namespace TemplateProject.Features.Meetings;

public class GetMeetingFormatsQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meeting-formats", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("GetMeetingFormats")
            .WithOpenApi()
            .WithTags("Meetings")
            .RequireAuthorization(AuthorizationPolicy.ManagementPolicy);
    }

    public record Request : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public List<MeetingFormat> MeetingFormats = [];
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var formats = Enum.GetValues<MeetingFormat>().ToList();
            return new Response
            {
                MeetingFormats = formats
            };
        }
    }
}