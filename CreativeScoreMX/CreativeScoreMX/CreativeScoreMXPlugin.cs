using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Newtonsoft.Json;
using Loupedeck;

namespace Loupedeck.CreativeScoreMX
{
    public class CreativeScoreMXPlugin : Plugin
    {
        public ConcurrentDictionary<string, string> ActionImages { get; } = new ConcurrentDictionary<string, string>();

        public override void Load()
        {
            WebSocketServerManager.Instance.OnMessageReceived += this.OnWebSocketMessage;
            WebSocketServerManager.Instance.Start();
        }

        public override void Unload()
        {
            WebSocketServerManager.Instance.Stop();
            WebSocketServerManager.Instance.OnMessageReceived -= this.OnWebSocketMessage;
        }

        private void OnWebSocketMessage(string message)
        {
            try
            {
                var payload = JsonConvert.DeserializeObject<WsPayload>(message);
                if (payload?.type == "UPDATE_IMAGES" && payload.keys != null)
                {
                    bool wasUpdated = false;
                    foreach (var keyData in payload.keys)
                    {
                        if (!string.IsNullOrEmpty(keyData.id) && !string.IsNullOrEmpty(keyData.image))
                        {
                            ActionImages[keyData.id] = keyData.image;
                            wasUpdated = true;
                        }
                    }

                    if (wasUpdated)
                    {
                        this.OnPluginStatusChanged(Loupedeck.PluginStatus.Normal, "Images Updated");
                        foreach (var keyData in payload.keys)
                        {
                            this.OnActionImageChanged(keyData.id, null);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to parse WS message: " + ex.Message);
            }
        }
    }

    // --- SELECTION BUTTONS ---
    
    public class RelojGameMinButton : PluginDynamicCommand
    {
        public RelojGameMinButton() : base("mx_reloj_game_min", "Reloj Principal: Minutos", "MX Smart Clock")
        {
            this.Description = "Pulsa para activar/desactivar la edición de Minutos del Reloj de Juego";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_game_min\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            return Helper.LoadIconOrFallback("reloj_min.png", imageSize, "MIN");
        }
    }

    public class RelojGameSecButton : PluginDynamicCommand
    {
        public RelojGameSecButton() : base("mx_reloj_game_sec", "Reloj Principal: Segundos", "MX Smart Clock")
        {
            this.Description = "Pulsa para activar/desactivar la edición de Segundos del Reloj de Juego";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_game_sec\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            return Helper.LoadIconOrFallback("reloj_sec.png", imageSize, "SEC");
        }
    }

    public class Reloj1424SecButton : PluginDynamicCommand
    {
        public Reloj1424SecButton() : base("mx_reloj_1424_sec", "Reloj 14/24: Segundos", "MX Smart Clock")
        {
            this.Description = "Pulsa para activar/desactivar la edición del Reloj de Posesión (14/24)";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_1424_sec\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            return Helper.LoadIconOrFallback("reloj_1424_sec.png", imageSize, "24 SEC");
        }
    }

    public class Reloj1424DecButton : PluginDynamicCommand
    {
        public Reloj1424DecButton() : base("mx_reloj_1424_dec", "Reloj 14/24: Décimas", "MX Smart Clock")
        {
            this.Description = "Pulsa para activar/desactivar la edición de Décimas del Reloj de Posesión (14/24)";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_1424_dec\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            return Helper.LoadIconOrFallback("reloj_1424_dec.png", imageSize, "24 DEC");
        }
    }

    // --- SMART DIAL ADJUSTMENT ---

    public class DialClockAdjustment : PluginDynamicAdjustment
    {
        public DialClockAdjustment() : base("Control_Clock_Dial", "Control Clock Dial", "MX Smart Clock", true)
        {
            this.Description = "Girar para ajustar el valor del reloj seleccionado actualmente. Pulsar para desactivar selección.";
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            string actionId = diff > 0 ? "dial_right" : "dial_left";
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"dial_click\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override string GetAdjustmentValue(string actionParameter) => "";

        protected override BitmapImage GetAdjustmentImage(string actionParameter, PluginImageSize imageSize)
        {
            return Helper.LoadIconOrFallback("reloj_dial.png", imageSize, "DIAL");
        }
    }

    // Helper classes
    public class WsPayload
    {
        public string type { get; set; }
        public List<KeyImage> keys { get; set; }
    }

    public class KeyImage
    {
        public string id { get; set; }
        public string image { get; set; }
    }

    public static class Helper
    {
        public static BitmapImage LoadIconOrFallback(string resourceName, PluginImageSize imageSize, string fallbackText)
        {
            try
            {
                var assembly = System.Reflection.Assembly.GetExecutingAssembly();
                var resourcePath = $"Loupedeck.CreativeScoreMX.Resources.{resourceName}";
                using (var stream = assembly.GetManifestResourceStream(resourcePath))
                {
                    if (stream != null)
                    {
                        var buffer = new byte[stream.Length];
                        stream.Read(buffer, 0, buffer.Length);
                        return BitmapImage.FromArray(buffer);
                    }
                }
            }
            catch { /* fallback on error */ }

            using (var bitmapBuilder = new BitmapBuilder(imageSize))
            {
                bitmapBuilder.Clear(BitmapColor.Black);
                bitmapBuilder.DrawText(fallbackText);
                return bitmapBuilder.ToImage();
            }
        }
    }
}
