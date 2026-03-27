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

    // BUTTON
    public class ClockMenuButton : PluginDynamicCommand
    {
        public ClockMenuButton() : base("Reloj_Click_Menu", "Click Menu Reloj", "MX Clock Controls")
        {
        }

        protected override void RunCommand(string actionParameter)
        {
            var message = "{\"event\":\"keyDown\",\"actionId\":\"clock_menu_click\"}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }
    }

    // ADJUSTMENTS
    public class WheelMenuAdjustment : PluginDynamicAdjustment
    {
        // Using the 4-arg constructor: Name, DisplayName, GroupName, IsParameterized
        public WheelMenuAdjustment() : base("Reloj_Rueda_Menu", "Control Menu Wheel", "MX Clock Controls", true)
        {
            this.Description = "Girar rueda para navegar menú de edición de reloj";
        }

        protected override PluginParameter[] GetParameters()
        {
            return new[] { new PluginParameter("default", "Rueda Menú", "Navegar") };
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            string actionId = diff > 0 ? "wheel_up" : "wheel_down";
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override String GetAdjustmentValue(String actionParameter) => "";
    }

    public class DialClockAdjustment : PluginDynamicAdjustment
    {
        public DialClockAdjustment() : base("Reloj_Dial_Ajuste", "Control Clock Dial", "MX Clock Controls", true)
        {
            this.Description = "Girar dial para sumar o restar tiempo al reloj";
        }

        protected override PluginParameter[] GetParameters()
        {
            return new[] { new PluginParameter("default", "Dial Reloj", "Ajustar tiempo") };
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            string actionId = diff > 0 ? "dial_right" : "dial_left";
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override String GetAdjustmentValue(String actionParameter) => "";
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
