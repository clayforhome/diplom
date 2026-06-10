using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text;
using TemplateProject.Common;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class DownloadMeetingFileQuery : IFeatureEndpoint
{
    private const string SeedFilesPrefix = "seed-files/";

    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapGet("/api/v1/meetings/{id:guid}/files/{fileId:guid}/download", async (
                Guid id,
                Guid fileId,
                IMediator mediator,
                CancellationToken cancellationToken) =>
                await mediator.Send(new Request(id, fileId), cancellationToken))
            .WithName("DownloadMeetingFile")
            .WithTags("Meeting Files")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid MeetingId, Guid FileId) : IRequest<IResult>;

    public class Handler : IRequestHandler<Request, IResult>
    {
        private readonly DatabaseContext _context;

        public Handler(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<IResult> Handle(Request request, CancellationToken cancellationToken)
        {
            var meetingExists = await _context.Meetings
                .AnyAsync(m => m.Id == request.MeetingId && !m.IsDeleted, cancellationToken);

            if (!meetingExists)
            {
                return ApiErrors.NotFound.Instance.Result;
            }

            var file = await _context.MeetingFiles
                .FirstOrDefaultAsync(mf => mf.Id == request.FileId && mf.MeetingId == request.MeetingId, cancellationToken);

            if (file == null)
            {
                return ApiErrors.NotFound.Instance.Result;
            }

            var downloadFileName = NormalizeFileName(file.FileName);
            var relativePath = file.FilePath.TrimStart('/', '\\');
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);

            if (File.Exists(fullPath))
            {
                return Results.File(
                    fullPath,
                    string.IsNullOrWhiteSpace(file.FileType) ? "application/octet-stream" : file.FileType,
                    fileDownloadName: downloadFileName,
                    enableRangeProcessing: true);
            }

            if (relativePath.Replace('\\', '/').StartsWith(SeedFilesPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var content = Encoding.UTF8.GetBytes($"""
                    Placeholder content for "{downloadFileName}".
                    This seeded file is not stored physically in the current environment,
                    but the download endpoint remains available for UI testing.
                    """);

                return Results.File(
                    content,
                    string.IsNullOrWhiteSpace(file.FileType) ? "application/octet-stream" : file.FileType,
                    fileDownloadName: downloadFileName);
            }

            return ApiErrors.NotFound.Instance.Result;
        }

        private static string NormalizeFileName(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return "meeting-file";
            }

            var trimmed = Path.GetFileName(fileName.Trim());
            var underscoreIndex = trimmed.IndexOf('_');

            if (underscoreIndex > 0 &&
                Guid.TryParse(trimmed[..underscoreIndex], out _) &&
                underscoreIndex < trimmed.Length - 1)
            {
                return trimmed[(underscoreIndex + 1)..];
            }

            return trimmed;
        }
    }
}
