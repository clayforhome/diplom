using JetBrains.Annotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Services;

namespace TemplateProject.Features.Meetings;

[PublicAPI]
public class DeleteMeetingFileCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapDelete("/api/v1/meetings/{id:guid}/files/{fileId:guid}", async (
                Guid id,
                Guid fileId,
                IMediator mediator,
                CancellationToken cancellationToken) =>
                await mediator.Send(new Request(id, fileId), cancellationToken))
            .WithName("DeleteMeetingFile")
            .WithTags("Meeting Files")
            .WithOpenApi()
            .RequireAuthorization();
    }

    public record Request(Guid MeetingId, Guid FileId) : IRequest<BaseApiResponse<MediatR.Unit>>;

    public class Handler : IRequestHandler<Request, BaseApiResponse<MediatR.Unit>>
    {
        private readonly DatabaseContext _context;
        private readonly CurrentUserProvider _currentUserProvider;
        private readonly ILogger<DeleteMeetingFileCommand> _logger;

        public Handler(DatabaseContext context, CurrentUserProvider currentUserProvider, ILogger<DeleteMeetingFileCommand> logger)
        {
            _context = context;
            _currentUserProvider = currentUserProvider;
            _logger = logger;
        }

        public async Task<BaseApiResponse<MediatR.Unit>> Handle(Request request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserProvider.GetCurrentUserId();
            if (currentUserId == null || currentUserId == Guid.Empty)
            {
                return ApiErrors.Unauthorized.Instance;
            }

            var meeting = await _context.Meetings
                .Where(m => !m.IsDeleted)
                .FirstOrDefaultAsync(m => m.Id == request.MeetingId, cancellationToken);

            if (meeting == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            if (meeting.OrganizerId != currentUserId.Value)
            {
                return ApiErrors.Forbidden.Instance;
            }

            var file = await _context.MeetingFiles
                .FirstOrDefaultAsync(mf => mf.Id == request.FileId && mf.MeetingId == request.MeetingId, cancellationToken);

            if (file == null)
            {
                return ApiErrors.NotFound.Instance;
            }

            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", file.FilePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete file {FilePath} for meeting file {FileId}", file.FilePath, file.Id);
            }

            _context.MeetingFiles.Remove(file);
            await _context.SaveChangesAsync(cancellationToken);

            return MediatR.Unit.Value;
        }
    }
}




