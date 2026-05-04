using System.ComponentModel.DataAnnotations;
using JetBrains.Annotations;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateProject.DataAccess;

namespace TemplateProject.Features.User;

[PublicAPI]
public class SignUpCommand : IFeatureEndpoint
{
    public void Map(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapPost("/api/v1/auth/sign-up", async (
                    IMediator mediator,
                    CancellationToken cancellationToken,
                    [FromBody] SignInRequest request) =>
                await mediator.Send(new Request(
                    request.Email,
                    request.Password,
                    request.PhoneNumber,
                    request.Name,
                    request.Age), cancellationToken))
            .WithName("SignUp")
            .WithTags("Auth")
            .WithOpenApi();
    }

    public class SignInRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public string? PhoneNumber { get; set; }
        public required string Name { get; set; }
        public int Age { get; set; }
    }

    public class Response
    {
        public required string Status { get; set; }
        public IEnumerable<IdentityError> Errors { get; set; } = [];
    }

    public record Request : IRequest<Response>
    {
        [Required(AllowEmptyStrings = false)]
        public string Email { get; set; }
        [Required(AllowEmptyStrings = false)]
        public string Password { get; set; }
        [Required(AllowEmptyStrings = true)]
        public string? PhoneNumber { get; set; }
        [Required(AllowEmptyStrings = false)]
        public string Name { get; set; }
        [Required(AllowEmptyStrings = false)]
        public int Age { get; set; }
        

        public Request(string email, string password, string? phoneNumber, string name, int age)
        {
            Email = email;
            Password = password;
            PhoneNumber = phoneNumber;
            Name = name;
            Age = age;
        }
    }
    
    public class Handler : IRequestHandler<Request, Response>
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

        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            var user = new Domain.User
            {
                UserName = request.Email,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Name = request.Name,
                Age = request.Age,
                RegistrationDate = _timeProvider.GetUtcNow().UtcDateTime,
                EmailConfirmed = true // Временная затычка, чтобы не реализовывать подтверждение почты сейчас 
            };
            
            var result = await _userManager.CreateAsync(user, request.Password);
            
            if (!result.Succeeded)
            {
                return new Response { Status = "Error", Errors = result.Errors };
            }
            
            await _context.SaveChangesAsync(cancellationToken);
            
            return new Response { Status = "Ok" };
        }
    }
}