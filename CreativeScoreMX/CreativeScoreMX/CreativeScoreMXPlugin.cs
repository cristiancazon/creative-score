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

    // --- SELECTION BUTTONS (Fixed IDs) ---
    
    public class RelojGameMinButton : PluginDynamicCommand
    {
        public RelojGameMinButton() : base("mx_reloj_game_min", "Reloj Principal: Minutos", "MX Clock Controls")
        {
            this.Description = "Pulsa para activar/desactivar la edición de Minutos del Reloj de Juego";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_game_min\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }
    }

    public class RelojGameSecButton : PluginDynamicCommand
    {
        public RelojGameSecButton() : base("mx_reloj_game_sec", "Reloj Principal: Segundos", "MX Clock Controls")
        {
            this.Description = "Pulsa para activar/desactivar la edición de Segundos del Reloj de Juego";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_game_sec\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }
    }

    public class Reloj1424SecButton : PluginDynamicCommand
    {
        public Reloj1424SecButton() : base("mx_reloj_1424_sec", "Reloj 14/24: Segundos", "MX Clock Controls")
        {
            this.Description = "Pulsa para activar/desactivar la edición del Reloj de Posesión (14/24)";
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"mx_reloj_1424_sec\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }
    }

    // --- SMART ADJUSTMENTS (DIAL & WHEEL) ---

    public class DialClockAdjustment : PluginDynamicAdjustment
    {
        public DialClockAdjustment() : base("Control_Clock_Dial", "Control Clock Dial", "MX Clock Controls", true)
        {
            this.Description = "Girar para ajustar el valor del reloj seleccionado actualmente";
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            string actionId = diff > 0 ? "dial_right" : "dial_left";
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override PluginParameter[] GetParameters()
        {
            return new[] { new PluginParameter("default", "Ajuste de Tiempo", "Girar para cambiar") };
        }

        protected override string GetAdjustmentValue(string actionParameter) => "";
    }

    public class WheelMenuAdjustment : PluginDynamicAdjustment
    {
        public WheelMenuAdjustment() : base("Control_Menu_Wheel", "Control Menu Wheel", "MX Clock Controls", true)
        {
            this.Description = "Girar para navegar o ajustar milésimas (futuro)";
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            string actionId = diff > 0 ? "wheel_up" : "wheel_down";
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override PluginParameter[] GetParameters()
        {
            return new[] { new PluginParameter("default", "Rueda Menú", "Navegar") };
        }

        protected override string GetAdjustmentValue(string actionParameter) => "";
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
}
