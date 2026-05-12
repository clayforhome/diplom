using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class ListMeetingFilesQuery : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meetings/{id:guid}/files", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken) =>
                await mediator.Send(new Request(id), cancellationToken))
            .WithName("ListMeetingFiles")
            .WithTags("Meeting Files")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid MeetingId) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public required List<FileData> Data { get; set; }
        public required string Status { get; set; }
    }

    public record FileData
    {
        public required Guid Id { get; set; }
        public required string FileName { get; set; }
        public required string FileType { get; set; }
        public required DateTime UploadedAt { get; set; }
        public string? UploaderName { get; set; }
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
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            var files = await _context.MeetingFiles
                .Where(mf => mf.MeetingId == request.MeetingId)
                .Include(mf => mf.UploadedBy)
                .OrderByDescending(mf => mf.UploadedAt)
                .Select(f => new FileData
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    FileType = f.FileType,
                    UploadedAt = f.UploadedAt,
                    UploaderName = f.UploadedBy != null ? f.UploadedBy.UserName : null
                })
                .ToListAsync(cancellationToken);

            return new Response { Data = files, Status = "Ok" };
        }
    }
}


