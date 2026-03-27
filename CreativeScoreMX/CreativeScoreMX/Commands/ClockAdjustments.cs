using System;

namespace Loupedeck.CreativeScoreMX.Commands
{
    // Maneja la rueda vertical (Wheel) para navegar por el menú
    public class WheelMenuAdjustment : PluginDynamicAdjustment
    {
        public WheelMenuAdjustment() : base(true)
        {
            this.DisplayName = "Control Menu Wheel";
            this.GroupName = "MX Clock Controls";
            this.Description = "Girar rueda para navegar menú de edición de reloj";
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            // diff > 0 es hacia arriba / derecha, diff < 0 es hacia abajo / izquierda
            string actionId = diff > 0 ? "wheel_up" : "wheel_down";
            
            // Reutilizamos el formato keyDown para que la web app lo procese igual
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }
    }

    // Maneja el dial central para sumar o restar tiempo
    public class DialClockAdjustment : PluginDynamicAdjustment
    {
        public DialClockAdjustment() : base(true)
        {
            this.DisplayName = "Control Clock Dial";
            this.GroupName = "MX Clock Controls";
            this.Description = "Girar dial para sumar o restar tiempo al reloj";
        }

        protected override void ApplyAdjustment(string actionParameter, int diff)
        {
            // diff > 0 es girar a la derecha, diff < 0 es girar a la izquierda
            string actionId = diff > 0 ? "dial_right" : "dial_left";
            
            // Reutilizamos el formato keyDown para que la web app lo procese igual
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }
    }
}
