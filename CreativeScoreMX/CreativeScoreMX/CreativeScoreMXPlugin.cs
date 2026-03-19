using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Newtonsoft.Json;
using Loupedeck.CreativeScoreMX.Commands;

namespace Loupedeck.CreativeScoreMX
{
    public class CreativeScoreMXPlugin : Plugin
    {
        // Thread-safe dictionary to store the latest base64 image coming from the Next.js app
        public ConcurrentDictionary<string, string> ActionImages { get; } = new ConcurrentDictionary<string, string>();

        public override void Load()
        {
            // Subscribe to WS messages from the web app
            WebSocketServerManager.Instance.OnMessageReceived += this.OnWebSocketMessage;

            // Start WS Server
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
                        // Tell Loupedeck to redraw all action keys
                        this.OnPluginStatusChanged(Loupedeck.PluginStatus.Normal, "Images Updated");
                        
                        // Action images require telling specific commands to refresh their UI
                        // This triggers the GetCommandImage() method in our GridCommand
                        foreach (var keyData in payload.keys)
                        {
                            this.OnActionImageChanged(keyData.id, null);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Ignore parsing errors
                Console.WriteLine("Failed to parse WS message in CreativeScoreMX plugin: " + ex.Message);
            }
        }

        public override void RunCommand(string commandName, string parameter)
        {
        }

        public override void ApplyAdjustment(string adjustmentName, string parameter, int diff)
        {
        }
    }

    // Helper classes for parsing incoming JSON from Next.js
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
