namespace TemplateProject.Domain;

public class Message
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Получатель сообщения
    /// </summary>
    public Guid RecipientId { get; set; }
    public User Recipient { get; set; }
    
    /// <summary>
    /// Тему сообщения (например, "Уведомление о новой встрече")
    /// </summary>
    public required string Subject { get; set; }
    
    /// <summary>
    /// Текст сообщения
    /// </summary>
    public required string Body { get; set; }
    
    /// <summary>
    /// Время отправки
    /// </summary>
    public DateTime SentAt { get; set; }
    
    /// <summary>
    /// Связанная встреча (опционально)
    /// </summary>
    public Guid? MeetingId { get; set; }
    public Meeting? Meeting { get; set; }
}