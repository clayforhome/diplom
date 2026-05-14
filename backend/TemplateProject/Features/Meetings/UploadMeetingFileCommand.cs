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
public class UploadMeetingFileCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/meetings/{id:guid}/files", async (
                Guid id,
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromForm] IFormFile file) =>
            {
                return await mediator.Send(new Request(id, file), cancellationToken);
            })
            .WithName("UploadMeetingFile")
            .WithTags("Meeting Files")
            .WithOpenApi()
            .RequireAuthorization(AuthorizationPolicy.ManagementPolicy)
            .DisableAntiforgery();
    }

    public record Request(Guid MeetingId, IFormFile File) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public required FileData Data { get; set; }
        public required string Status { get; set; }
    }

    public record FileData
    {
        public required Guid Id { get; set; }
        public required Guid MeetingId { get; set; }
        public required string FileName { get; set; }
        public required string FileType { get; set; }
        public required DateTime UploadedAt { get; set; }
        public required Guid UploadedById { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private static readonly HashSet<string> SupportedFileExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf",
            ".doc",
            ".docx",
            ".ppt",
            ".pptx",
            ".xls",
            ".xlsx",
            ".txt",
            ".jpg",
            ".jpeg",
            ".png"
        };

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
            var isAdmin = string.Equals(_currentUserProvider.GetRole(), Role.Admin, StringComparison.Ordinal);
            if (currentUserId == null || currentUserId == Guid.Empty)
            {
                return ApiErrors.Unauthorized.Instance;
            }

            // Check if meeting exists and not deleted
            var meeting = await _context.Meetings
                .Where(m => !m.IsDeleted)
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (!isAdmin && meeting.OrganizerId != currentUserId.Value)
            {
                return ApiErrors.Forbidden.Instance;
            }

            // Validate file
            if (request.File.Length == 0)
            {
                return new ApiErrors.ValidationError("The uploaded file is empty.");
            }

            var originalFileName = Path.GetFileName(request.File.FileName);
            if (string.IsNullOrWhiteSpace(originalFileName))
            {
                return new ApiErrors.ValidationError("A file name is required.");
            }

            var fileExtension = Path.GetExtension(originalFileName);
            if (string.IsNullOrWhiteSpace(fileExtension) || !SupportedFileExtensions.Contains(fileExtension))
            {
                return new ApiErrors.ValidationError(
                    $"Unsupported file type '{fileExtension}'. Allowed types: {string.Join(", ", SupportedFileExtensions.OrderBy(x => x))}.");
            }

            // Generate unique file path
            var fileName = $"{Guid.NewGuid()}_{originalFileName}";
            var filePath = Path.Combine("files", "meetings", request.MeetingId.ToString(), fileName);
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
            var fullDirectory = Path.GetDirectoryName(fullPath);

            // Create directory if not exists
            if (string.IsNullOrWhiteSpace(fullDirectory))
            {
                return new ApiErrors.ValidationError("Could not determine a storage directory for the uploaded file.");
            }

            if (!Directory.Exists(fullDirectory))
            {
                Directory.CreateDirectory(fullDirectory);
            }

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream, cancellationToken);
            }

            // Create MeetingFile entity
            var meetingFile = new MeetingFile
            {
                Id = Guid.NewGuid(),
                MeetingId = request.MeetingId,
                FileName = originalFileName,
                FilePath = filePath,
                FileType = request.File.ContentType ?? string.Empty,
                UploadedById = currentUserId.Value,
                UploadedAt = DateTime.UtcNow
            };

            _context.MeetingFiles.Add(meetingFile);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new Response
            {
                Data = new FileData
                {
                    Id = meetingFile.Id,
                    MeetingId = meetingFile.MeetingId,
                    FileName = meetingFile.FileName,
                    FileType = meetingFile.FileType,
                    UploadedAt = meetingFile.UploadedAt,
                    UploadedById = meetingFile.UploadedById
                },
                Status = "Ok"
            };

            return response;
        }
    }
}






