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
        var userId = httpContext?.User.FindFirstValue(JwtClaimTypes.Subject)
                     ?? httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!string.IsNullOrWhiteSpace(userId))
        {
            _currentUserId = Guid.Parse(userId);
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