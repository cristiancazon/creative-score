using System;
using System.Reflection;
using System.Linq;

class Program {
    static void Main() {
        var dllPath = "CreativeScoreMX\\bin\\Release\\Loupedeck.Api.dll";
        if (!System.IO.File.Exists(dllPath)) {
            Console.WriteLine("Cannot find Loupedeck.Api.dll in bin/Release");
            return;
        }

        var asm = Assembly.LoadFrom(dllPath);
        var builderType = asm.GetType("Loupedeck.BitmapBuilder");
        if (builderType != null) {
            Console.WriteLine("BitmapBuilder properties:");
            foreach(var p in builderType.GetProperties()) Console.WriteLine(p.Name);
            Console.WriteLine("BitmapBuilder methods:");
            foreach(var method in builderType.GetMethods().Where(m => m.Name.Contains("DrawImage") || m.Name.Contains("Stretch"))) {
                Console.WriteLine(method.Name + "(" + string.Join(", ", method.GetParameters().Select(param => param.ParameterType.Name)) + ")");
            }
        }

        var imgType = asm.GetType("Loupedeck.BitmapImage");
        if (imgType != null) {
            Console.WriteLine("BitmapImage methods:");
            foreach(var method in imgType.GetMethods().Where(m => m.Name.Contains("Resize") || m.Name.Contains("Scale"))) {
                Console.WriteLine(method.Name + "(" + string.Join(", ", method.GetParameters().Select(param => param.ParameterType.Name)) + ")");
            }
        }
    }
}
