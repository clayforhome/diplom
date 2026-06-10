using TemplateProject.Common;

namespace TemplateProject.Middlewares;

public class BaseResponseFilter : IEndpointFilter
{
    private readonly ILogger<BaseResponseFilter> _logger;

    public BaseResponseFilter(ILogger<BaseResponseFilter> logger)
    {
        _logger = logger;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var result = await next(context);
        
        if(result is IBaseApiResponse oneOfResponse)
        {
            var content = oneOfResponse.GetContent();

            if (content is IResult iResult)
            {
                return iResult;
            }
            
            var error = oneOfResponse.GetError();

            if (error != null)
            {
                _logger.LogWarning(
                    "Got api error with code: {Code} status: {Status}",
                    error.Code,
                    error.Status
                );
            }

            return error != null ? error.Result : Results.Json(content);
        }

        return result;
    }
}