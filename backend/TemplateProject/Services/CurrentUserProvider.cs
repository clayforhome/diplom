using System.Security.Claims;
using Duende.IdentityModel;

namespace TemplateProject.Services;

public class CurrentUserProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _currentUserId;

    public CurrentUserProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetCurrentUserId()
    {
        if (_currentUserId != null)
        {
            return _currentUserId;
        }
        
        var httpContext = _httpContextAccessor.HttpContext;

        var userId = httpContext?.User.FindFirst(JwtClaimTypes.Subject);

        if (userId?.Value != null)
        {
            _currentUserId = Guid.Parse(userId.Value);
            return _currentUserId;
        }

        return null;
    }

    public void SetCurrentUserId(Guid userId)
    {
        _currentUserId = userId;
    }

    public string GetRole()
    {
        var role = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role);
        return role!.Value;
    }
}