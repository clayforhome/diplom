using MediatR;
using TemplateProject.Common;
using TemplateProject.Domain;

namespace TemplateProject.Features.Ui;

public class GetSelectOptionsQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/ui/select-options", async (
                IMediator mediator,
                CancellationToken cancellationToken) =>
            {
                return await mediator.Send(new Request(), cancellationToken);
            })
            .WithName("GetSelectOptions")
            .WithOpenApi()
            .WithTags("Ui")
            .RequireAuthorization(AuthorizationPolicy.UserPolicy);
    }

    public record Request : IRequest<BaseApiResponse<Response>>;

    public record SelectOption(string Value, string Label);

    public record Response
    {
        public List<SelectOption> MeetingFormats { get; set; } = [];
        public List<SelectOption> MeetingStatuses { get; set; } = [];
        public List<SelectOption> AdminUserSortKeys { get; set; } = [];
        public List<SelectOption> SortDirections { get; set; } = [];
        public List<SelectOption> PageSizes { get; set; } = [];
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            return new Response
            {
                MeetingFormats = Enum.GetValues<MeetingFormat>()
                    .Select(format => new SelectOption(format.ToString(), GetMeetingFormatLabel(format)))
                    .ToList(),
                MeetingStatuses = Enum.GetValues<MeetingStatus>()
                    .Select(status => new SelectOption(status.ToString(), GetMeetingStatusLabel(status)))
                    .ToList(),
                AdminUserSortKeys =
                [
                    new("name", "Имя"),
                    new("userName", "ФИО"),
                    new("email", "Эл. почта"),
                    new("age", "Возраст"),
                    new("registrationDate", "Дата регистрации"),
                    new("emailConfirmed", "Подтверждение email"),
                    new("id", "ID")
                ],
                SortDirections =
                [
                    new("asc", "По возрастанию"),
                    new("desc", "По убыванию")
                ],
                PageSizes =
                [
                    new("6", "6"),
                    new("12", "12"),
                    new("24", "24"),
                    new("48", "48")
                ]
            };
        }

        private static string GetMeetingFormatLabel(MeetingFormat format) => format switch
        {
            MeetingFormat.Offline => "Офлайн",
            MeetingFormat.Online => "Онлайн",
            MeetingFormat.Hybrid => "Гибрид",
            MeetingFormat.Phone => "Телефон",
            _ => format.ToString()
        };

        private static string GetMeetingStatusLabel(MeetingStatus status) => status switch
        {
            MeetingStatus.Draft => "Черновик",
            MeetingStatus.Scheduled => "Запланирована",
            MeetingStatus.AwaitingConfirmation => "Ожидает подтверждения",
            MeetingStatus.Confirmed => "Подтверждена",
            MeetingStatus.Rescheduled => "Перенесена",
            MeetingStatus.Cancelled => "Отменена",
            MeetingStatus.Completed => "Завершена",
            _ => status.ToString()
        };
    }
}
