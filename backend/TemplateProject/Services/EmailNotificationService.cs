using System.Net.Mail;
using TemplateProject.DataAccess;
using TemplateProject.Domain;

namespace TemplateProject.Services;

/// <summary>
/// Интерфейс для сервиса отправки уведомлений по email
/// </summary>
public interface IEmailNotificationService
{
    /// <summary>
    /// Отправить уведомление о новой встрече
    /// </summary>
    Task SendMeetingInvitationAsync(User recipient, Meeting meeting, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Отправить уведомление об обновлении встречи
    /// </summary>
    Task SendMeetingUpdateAsync(User recipient, Meeting meeting, string changes, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Отправить пользовательское сообщение
    /// </summary>
    Task SendCustomMessageAsync(User recipient, string subject, string body, Guid? meetingId = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Реализация сервиса отправки email уведомлений с использованием Mailtrap
/// </summary>
public class EmailNotificationService : IEmailNotificationService
{
    private readonly DatabaseContext _context;
    private readonly ILogger<EmailNotificationService> _logger;
    private readonly IConfiguration _configuration;
    
    public EmailNotificationService(DatabaseContext context, ILogger<EmailNotificationService> logger, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }
    
    public async Task SendMeetingInvitationAsync(User recipient, Meeting meeting, CancellationToken cancellationToken = default)
    {
        var subject = "Вы приглашены на встречу";
        var body = GenerateMeetingInvitationBody(recipient, meeting);
        
        await SendCustomMessageAsync(
            recipient,
            subject,
            body,
            meeting.Id,
            cancellationToken);
    }
    
    public async Task SendMeetingUpdateAsync(User recipient, Meeting meeting, string changes, CancellationToken cancellationToken = default)
    {
        var subject = "Встреча обновлена";
        var body = GenerateMeetingUpdateBody(recipient, meeting, changes);
        
        await SendCustomMessageAsync(
            recipient,
            subject,
            body,
            meeting.Id,
            cancellationToken);
    }
    
    public async Task SendCustomMessageAsync(
        User recipient,
        string subject,
        string body,
        Guid? meetingId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Сохранить сообщение в БД
            var message = new Message
            {
                Id = Guid.NewGuid(),
                RecipientId = recipient.Id,
                Subject = subject,
                Body = body,
                MeetingId = meetingId,
                SentAt = DateTime.UtcNow,
            };
            
            _context.Messages.Add(message);
            await _context.SaveChangesAsync(cancellationToken);
            
            await SendEmailAsync(recipient.Email!, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при отправке сообщения получателю {RecipientEmail}", recipient.Email);
        }
    }
    
    private string GenerateMeetingInvitationBody(User recipient, Meeting meeting)
    {
        var localDateTime = meeting.StartTime.AddHours(5); // Преобразуем время в местное (UTC+5)
        var meetingDateTime = $"{localDateTime:dd.MM.yyyy HH:mm}";
        var meetingLink = $"http://localhost:3000/sessions/{meeting.Id}";
        
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f4f4f4; padding: 20px; border-radius: 0 0 5px 5px; }}
        .button {{ background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }}
        .footer {{ margin-top: 20px; color: #7f8c8d; font-size: 12px; }}
        h2 {{ color: #2c3e50; }}
        .lang-section {{ margin-top: 30px; padding-top: 20px; border-top: 2px solid #bdc3c7; }}
        .lang-section h2 {{ color: #2c3e50; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <center><h1>Приглашение на встречу</h1></center>
            <center><h1>Кездесуге арналған шақыру<h1></center>
        </div>
        <div class='content'>
            <h2>Здравствуйте, {recipient.Name}!</h2>
            
            <p>Вас приглашают на встречу:</p>
            
            <h3>{meeting.Title}</h3>
            <p><strong>Дата и время:</strong> {meetingDateTime}</p>
            <p><strong>Формат:</strong> {meeting.Format}</p>
            
            {(meeting.Location != null ? $"<p><strong>Место проведения:</strong> {meeting.Location}</p>" : "")}
            {(meeting.MeetingLink != null ? $"<p><strong>Ссылка на встречу:</strong> <a href='{meeting.MeetingLink}'>{meeting.MeetingLink}</a></p>" : "")}
            {(meeting.ContactInfo != null ? $"<p><strong>Контактная информация:</strong> {meeting.ContactInfo}</p>" : "")}
            
            {(meeting.Description != null ? $"<p><strong>Описание:</strong> {meeting.Description}</p>" : "")}
            
            <a href='{meetingLink}' class='button'>Просмотреть встречу</a>

            <div class='footer'>
                <p>Это автоматическое письмо. Пожалуйста, не отвечайте на него.</p>
            </div>
            
            <div class='lang-section'>
                <h2>Сәлем, {recipient.Name}!</p>

                <p>Сіз төмендегі ресімді шақырудаласыз:</p>
                
                <h3>{meeting.Title}</h3>
                <p><strong>Уақыты:</strong> {meetingDateTime}</p>
                <p><strong>Формат:</strong> {meeting.Format}</p>
                
                {(meeting.Location != null ? $"<p><strong>Орны:</strong> {meeting.Location}</p>" : "")}
                {(meeting.MeetingLink != null ? $"<p><strong>Сілтеме:</strong> <a href='{meeting.MeetingLink}'>{meeting.MeetingLink}</a></p>" : "")}
                {(meeting.ContactInfo != null ? $"<p><strong>Байланыс ақпараты:</strong> {meeting.ContactInfo}</p>" : "")}
                
                {(meeting.Description != null ? $"<p><strong>Сипаттама:</strong> {meeting.Description}</p>" : "")}

                <a href='{meetingLink}' class='button'>Ресімді көру</a>
            </div>

            <div class='footer'>
                <p>Бұл автоматты хат. Оған жауап бермеңіз.</p>
            </div>
        </div>
    </div>
</body>
</html>
";
    }
    
    private string GenerateMeetingUpdateBody(User recipient, Meeting meeting, string changes)
    {
        var localDateTime = meeting.StartTime.AddHours(5); // Преобразуем время в местное (UTC+5)
        var meetingDateTime = $"{localDateTime:dd.MM.yyyy HH:mm}";
        var meetingLink = $"http://localhost:3000/sessions/{meeting.Id}";
        
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f4f4f4; padding: 20px; border-radius: 0 0 5px 5px; }}
        .button {{ background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }}
        .footer {{ margin-top: 20px; color: #7f8c8d; font-size: 12px; }}
        h2 {{ color: #2c3e50; }}
        .lang-section {{ margin-top: 30px; padding-top: 20px; border-top: 2px solid #bdc3c7; }}
        .lang-section h2 {{ color: #8e7cc3; }}
        .changes {{ background-color: #fadbd8; padding: 10px 15px; border-left: 4px solid #e74c3c; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>⚠️ Встреча обновлена</h1>
        </div>
        <div class='content'>
            <h2>Здравствуйте, {recipient.Name}!</h2>
            
            <p>Встреча <strong>{meeting.Title}</strong> была обновлена.</p>
            
            <div class='changes'>
                <p><strong>Изменения:</strong><br>{changes}</p>
            </div>
            
            <p><strong>Новые данные встречи:</strong><br>
            Дата и время: {meetingDateTime}<br>
            Формат: {meeting.Format}</p>
            
            <a href='{meetingLink}' class='button'>Просмотреть обновленную встречу</a>
            
            <div class='footer'>
                <p>Это автоматическое письмо. Пожалуйста, не отвечайте на него.</p>
            </div>
            
            <div class='lang-section'>
                <h2>Сәлем, {recipient.Name}!</p>
                <p><strong>{meeting.Title}</strong> өндіктігі жаңартылды.</p>
                
                <div class='changes'>
                    <p><strong>Өзгерістер:</strong><br>{changes}</p>
                </div>
                
                <p><strong>Жаңа ресімінің мәліметтері:</strong><br>
                Уақыты: {meetingDateTime}<br>
                Формат: {meeting.Format}</p>
                
                <a href='{meetingLink}' class='button'>Жаңартылған ресімді көру</a>

                <div class='footer'>
                    <p>Бұл автоматты хат. Оған жауап бермеңіз.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
";
    }
    
    private async Task SendEmailAsync(string recipientEmail, string subject, string body)
    {
        try
        {
            var host = _configuration["SmtpSettings:Host"];
            var port = Convert.ToInt32(_configuration["SmtpSettings:Port"]);
            var username = _configuration["SmtpSettings:Username"];
            var password = _configuration["SmtpSettings:Password"];

            var smtpClient = new SmtpClient(host)
            {
                Port = port,
                Credentials = new System.Net.NetworkCredential(username, password),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(username, "Meeting Sign System"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
            };
            
            mailMessage.To.Add(recipientEmail);
            
            await smtpClient.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при отправке сообщения получателю {RecipientEmail}", recipientEmail);
        }
    }
}



