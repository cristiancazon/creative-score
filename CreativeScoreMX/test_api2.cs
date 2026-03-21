using System;
using System.Reflection;
using System.Linq;

class Program {
    static void Main() {
        var dllPath = "C:\\Users\\crist\\.nuget\\packages\\loupedeckapi\\5.0.0\\lib\\net472\\Loupedeck.Api.dll";
        if (!System.IO.File.Exists(dllPath)) {
            Console.WriteLine("Cannot find Loupedeck.Api.dll");
            return;
        }

        var asm = Assembly.LoadFrom(dllPath);
        var type = asm.GetType("Loupedeck.PluginDynamicCommand");
        if (type != null) {
            Console.WriteLine("PluginDynamicCommand properties:");
            foreach(var p in type.GetProperties()) Console.WriteLine(p.Name + " (" + p.PropertyType.Name + ")");
            Console.WriteLine("PluginDynamicCommand fields:");
            foreach(var f in type.GetFields()) Console.WriteLine(f.Name + " (" + f.FieldType.Name + ")");
        }
    }
}
