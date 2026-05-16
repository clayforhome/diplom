using System.ComponentModel.DataAnnotations;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateProject.Common;
using TemplateProject.DataAccess;
using TemplateProject.Domain;

namespace TemplateProject.Features.User;

[PublicAPI]
public class SignUpCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/auth/sign-up", async (
                    IMediator mediator,
                    CancellationToken cancellationToken,
                    [FromBody] SignUpModel model) =>
                await mediator.Send(new Request(model), cancellationToken))
            .WithName("SignUp")
            .WithTags("Auth")
            .WithOpenApi();
    }

    public record SignUpModel
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public string? PhoneNumber { get; set; }
        public required string Name { get; set; }
        public int Age { get; set; }
    }

    public record Request(SignUpModel Model) : IRequest<BaseApiResponse<Response>>;

    public record Response
    {
        public SignUpResponseData Data { get; set; }
        public string Status { get; set; }
    }

    public class SignUpResponseData
    {
        public string Message { get; set; } = "Sign up successful";
    }
    
    public class Handler : IRequestHandler<Request, BaseApiResponse<Response>>
    {
        private readonly UserManager<Domain.User> _userManager;
        private readonly DatabaseContext _context;
        private readonly TimeProvider _timeProvider;

        public Handler(UserManager<Domain.User> userManager, TimeProvider timeProvider, DatabaseContext context)
        {
            _userManager = userManager;
            _timeProvider = timeProvider;
            _context = context;
        }

        public async Task<BaseApiResponse<Response>> Handle(Request request, CancellationToken cancellationToken)
        {
            var user = new Domain.User
            {
                UserName = request.Model.Email,
                Email = request.Model.Email,
                PhoneNumber = request.Model.PhoneNumber,
                Name = request.Model.Name,
                Age = request.Model.Age,
                RegistrationDate = _timeProvider.GetUtcNow().UtcDateTime,
                EmailConfirmed = true,
            };
            
            var result = await _userManager.CreateAsync(user, request.Model.Password);
            
            if (!result.Succeeded)
            {
                return ApiErrors.BadRequest.Instance;
            }
            
            await _userManager.AddToRoleAsync(user, Role.User);
            
            await _context.SaveChangesAsync(cancellationToken);
            
            return new Response { Data = new SignUpResponseData(), Status = "Ok" };
        }
    }
}