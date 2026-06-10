using JetBrains.Annotations;

namespace TemplateProject;

[UsedImplicitly(ImplicitUseTargetFlags.WithInheritors | ImplicitUseTargetFlags.WithMembers)]
public interface IFeatureEndpoint
{
    void Map(IEndpointRouteBuilder endpointRouteBuilder);
}