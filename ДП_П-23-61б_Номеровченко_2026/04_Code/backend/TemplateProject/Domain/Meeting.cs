namespace TemplateProject.Domain;

public class Meeting
{
    public Guid Id { get; set; }
    
    public required string Title { get; set; }
    public string? Description { get; set; }
    
    public DateTime Date { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    public Guid OrganizerId { get; set; }
    public User? Organizer { get; set; }
    
    public MeetingFormat Format { get; set; }
    public MeetingStatus Status { get; set; }
    
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public string? ContactInfo { get; set; }
    
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public User? DeletedByUser { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public List<MeetingParticipant> Participants { get; set; } = [];
    public List<MeetingFile> Files { get; set; } = [];
}

