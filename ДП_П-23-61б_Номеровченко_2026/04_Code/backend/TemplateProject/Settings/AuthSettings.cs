using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace TemplateProject.Settings;

public class AuthSettings
{
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public string Key { get; set; }
    public TimeSpan Lifetime { get; set; }

    public SymmetricSecurityKey GetSymmetricSecurityKey() => new(Encoding.UTF8.GetBytes(Key));
}