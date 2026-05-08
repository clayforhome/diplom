namespace TemplateProject.Domain;

public class MeetingParticipant
{
    public Guid Id { get; set; }
    
    public Guid MeetingId { get; set; }
    public Meeting? Meeting { get; set; }
    
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    public InvitationStatus InvitationStatus { get; set; }
    public bool IsRequired { get; set; }
    
    public DateTime InvitedAt { get; set; }
    public DateTime? ResponseAt { get; set; }
    public string? Comment { get; set; }
}

