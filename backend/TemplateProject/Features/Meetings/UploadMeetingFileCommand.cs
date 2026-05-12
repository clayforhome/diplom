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

            // Validate file
            if (request.File.Length == 0)
            {
                return ApiErrors.BadRequest.Instance;
            }

            // Supported file types
            var supportedTypes = new[] { ".pdf", ".docx", ".pptx", ".xlsx", ".jpg", ".jpeg", ".png" };
            var fileExtension = Path.GetExtension(request.File.FileName).ToLower();
            
            if (!supportedTypes.Contains(fileExtension))
            {
                return ApiErrors.BadRequest.Instance;
            }

            // Generate unique file path
            var fileName = $"{Guid.NewGuid()}_{request.File.FileName}";
            var filePath = Path.Combine("files", "meetings", request.MeetingId.ToString(), fileName);

            // Create directory if not exists
            var directory = Path.GetDirectoryName(filePath);
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory!);
            }

            // Save file
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream, cancellationToken);
            }

            // Create MeetingFile entity
            var meetingFile = new MeetingFile
            {
                Id = Guid.NewGuid(),
                MeetingId = request.MeetingId,
                FileName = request.File.FileName,
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






