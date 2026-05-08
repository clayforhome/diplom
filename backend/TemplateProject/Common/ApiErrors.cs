using System.ComponentModel;
using System.Text.Json.Serialization;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;

namespace TemplateProject.Common;

public static class ApiErrors
{
    public static class Codes
    {
        public const string UserNotExists = "user_not_exists";
        public const string TokenIsEmpty = "token_is_empty";
        public const string TooManyIncorrectCodeAttempts = "too_many_incorrect_code_attempts";
        public const string VerificationRequestTooFrequent = "verification_request_too_frequent";
    }

    [PublicAPI]
    public abstract class BaseApiError : BaseError
    {
        public string Type => CreateType();
        public abstract int Status { get; }
        public abstract string Code { get; }
        public string? Title { get; }

        protected string CreateType() => $"urn:errors:{Code}";

        protected IResult ToProblemDetails(string code, Dictionary<string, object?>? extensions = null)
        {
            var problem = new ProblemDetails
            {
                Type = $"urn:errors:{code}",
                Status = Status,
                Extensions =
                {
                    ["code"] = code
                }
            };

            if (extensions is not null)
            {
                foreach (var (key, value) in extensions)
                {
                    problem.Extensions[key] = value;
                }
            }

            return Results.Problem(problem);
        }

        public abstract IResult Result { get; }
    }

    public class NotFound : BaseApiError
    {
        public static NotFound Instance { get; } = new();

        public override int Status => StatusCodes.Status404NotFound;
        public override string Code => "not_found";
        public override IResult Result => Results.NotFound();
    }

    public class BadRequest : BaseApiError
    {
        public static BadRequest Instance { get; } = new();
        public override int Status => StatusCodes.Status400BadRequest;
        public override string Code => "bad_request";
        public override IResult Result => Results.BadRequest();
    }

    public class Forbidden : BaseApiError
    {
        public static Forbidden Instance { get; } = new();
        public override int Status => StatusCodes.Status403Forbidden;
        public override string Code => "forbidden";
        public override IResult Result => Results.Forbid();
    }

    [Obsolete]
    public class UserAlreadyExists : BaseApiError
    {
        public static UserAlreadyExists Instance { get; } = new();

        public override int Status => StatusCodes.Status409Conflict;
        public override string Code => "user_already_exists";
        public override IResult Result => ToProblemDetails(Code);
    }

    public class ValidationError : BaseApiError
    {
        private readonly IEnumerable<string> _validations;

        public ValidationError(params string[] validations)
        {
            _validations = validations;
        }

        public override int Status => StatusCodes.Status400BadRequest;
        public override string Code => "validation_error";
        public override IResult Result => Results.BadRequest(new { Errors = _validations });
    }

    [PublicAPI]
    public class VerificationRequestTooFrequentError(TimeSpan nextAttempt) : BaseApiError
    {
        public int NextAttemptInSeconds { get; }

        public override int Status => StatusCodes.Status429TooManyRequests;

        [DefaultValue(Codes.VerificationRequestTooFrequent)]
        public override string Code => Codes.VerificationRequestTooFrequent;

        [JsonIgnore]
        public override IResult Result => ToProblemDetails(
            Code,
            new Dictionary<string, object?>
            {
                { "code", Code },
                { "nextAttemptInSeconds", (int)Math.Round(nextAttempt.TotalSeconds, MidpointRounding.ToPositiveInfinity) }
            }
        );
    }

    public class Unauthorized : BaseApiError
    {
        public static Unauthorized Instance { get; } = new();
        public override int Status => StatusCodes.Status401Unauthorized;
        public override string Code => "unauthorized";
        public override IResult Result => Results.Unauthorized();
    }
}

public class BaseError;

public class Errors
{
    public class NotificationSendingFailed : BaseError
    {
        public static NotificationSendingFailed Instance { get; } = new();
    }
}