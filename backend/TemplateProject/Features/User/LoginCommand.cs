using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Duende.IdentityModel;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TemplateProject.Common;
using TemplateProject.Settings;

namespace TemplateProject.Features.User;

[PublicAPI]
public class LoginCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/auth/login", async (
                IMediator mediator,
                CancellationToken cancellationToken,
                [FromBody] LoginRequest request) =>
            {
                return await mediator.Send(new Request(request.Login, request.Password), cancellationToken);
            })
            .WithName("Login")
            .WithTags("Auth")
            .WithOpenApi();
    }

    public class LoginRequest
    {
        public required string Login { get; set; }
        public required string Password {get; set;}
    }

    public record Request(string Login, string Password) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public LoginResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class LoginResponseData
    {
        public required string UserName { get; set; }
        public required string Token { get; set; }
    }

    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly SignInManager<Domain.User> _signInManager;
        private readonly AuthSettings _authOptions;
        private readonly TimeProvider _timeProvider;

        public Handler(IOptions<AuthSettings> authSettings, SignInManager<Domain.User> signInManager, TimeProvider timeProvider)
        {
            _signInManager = signInManager;
            _timeProvider = timeProvider;
            _authOptions = authSettings.Value;
        }
        
        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            if (request.Login == "" || request.Password == "")
            {
                return ApiErrors.BadRequest.Instance;
            }
            
            var user = await _signInManager.UserManager.FindByNameAsync(request.Login);
            
            if (user is null)
            {
                return ApiErrors.Unauthorized.Instance;
            }
            
            var checkPasswordResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

            if (!checkPasswordResult.Succeeded)
            {
                return ApiErrors.Unauthorized.Instance;
            }

            var checkEmailConfirmation = await _signInManager.UserManager.IsEmailConfirmedAsync(user);
            
            if (!checkEmailConfirmation)
            {
                return ApiErrors.Forbidden.Instance;
            }
            
            var roles = await _signInManager.UserManager.GetRolesAsync(user);
            
            var response = new Response
            {
                Data = new LoginResponseData
                {
                    UserName = user.Id.ToString(),
                    Token = GenerateJwtToken(user, roles)
                },
                Status = "Ok"
            };

            return response;
        }
        
        private string GenerateJwtToken(Domain.User user, IEnumerable<string> roles)
        {
            var currentDate = _timeProvider.GetUtcNow();
            
            var claims = new List<Claim>
            {
                new(JwtClaimTypes.Subject, user.Id.ToString()),
                new(JwtClaimTypes.IssuedAt, currentDate.ToUnixTimeSeconds().ToString()),
            };
            claims.AddRange(roles.Select(role => new Claim(JwtClaimTypes.Role, role)));
            
            var jwt = new JwtSecurityToken(
                issuer: _authOptions.Issuer,
                audience: _authOptions.Audience,
                claims: claims,
                expires: currentDate.Add(_authOptions.Lifetime).UtcDateTime,
                signingCredentials: new SigningCredentials(_authOptions.GetSymmetricSecurityKey(),
                    SecurityAlgorithms.HmacSha256));

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
    }
}