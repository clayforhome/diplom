namespace TemplateProject.Common;

public sealed class Unit
{
    public static readonly Unit Value = new();
    private Unit() { }

    public override string ToString() => "()";
}
