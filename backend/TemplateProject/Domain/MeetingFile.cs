namespace TemplateProject.Domain;

public class MeetingFile
{
    public Guid Id { get; set; }
    
    public Guid MeetingId { get; set; }
    public Meeting? Meeting { get; set; }
    
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public required string FileType { get; set; }
    
    public Guid UploadedById { get; set; }
    public User? UploadedBy { get; set; }
    
    public DateTime UploadedAt { get; set; }
}

