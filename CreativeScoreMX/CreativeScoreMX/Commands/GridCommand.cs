using System;
using System.Collections.Generic;

namespace Loupedeck.CreativeScoreMX.Commands
{
    public abstract class BaseScoreCommand : PluginDynamicCommand
    {
        protected readonly string _actionId;

        public BaseScoreCommand(string name, string displayName, string groupName) 
            : base(name, displayName, groupName)
        {
            _actionId = name;
        }

        protected override void RunCommand(string actionParameter)
        {
            // When user presses a physical key, send it to Next.js WS
            var message = $"{{\"event\":\"keyDown\",\"actionId\":\"{_actionId}\"}}";
            WebSocketServerManager.Instance.BroadcastMessage(message);
        }

        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            // First check if the plugin has a cached image for this action (from WebSocket update)
            if (this.Plugin is CreativeScoreMXPlugin myPlugin && 
                myPlugin.ActionImages.TryGetValue(_actionId, out var base64))
            {
                try 
                {
                    return BitmapImage.FromArray(Convert.FromBase64String(base64));
                }
                catch (Exception e)
                {
                    Console.WriteLine($"Error loading image for {_actionId}: {e.Message}");
                }
            }

            // Fallback: draw a basic text box
            using (var bitmapBuilder = new BitmapBuilder(imageSize))
            {
                bitmapBuilder.Clear(BitmapColor.Black);
                bitmapBuilder.DrawText(_actionId.Replace("mx_grid_", "G").Replace("mx_team_", ""), BitmapColor.White);
                return bitmapBuilder.ToImage();
            }
        }

        protected override string GetCommandDisplayName(string actionParameter, PluginImageSize imageSize)
        {
            // Return zero-width space to hide text but trick layout into zero-pixel bounding height
            return "\u200B";
        }
    }

    public class Grid0Command : BaseScoreCommand { public Grid0Command() : base("mx_grid_0", "Grid 0", "MX Grid Actions") { } }
    public class Grid1Command : BaseScoreCommand { public Grid1Command() : base("mx_grid_1", "Grid 1", "MX Grid Actions") { } }
    public class Grid2Command : BaseScoreCommand { public Grid2Command() : base("mx_grid_2", "Grid 2", "MX Grid Actions") { } }
    public class Grid3Command : BaseScoreCommand { public Grid3Command() : base("mx_grid_3", "Grid 3", "MX Grid Actions") { } }
    public class Grid4Command : BaseScoreCommand { public Grid4Command() : base("mx_grid_4", "Grid 4", "MX Grid Actions") { } }
    public class Grid5Command : BaseScoreCommand { public Grid5Command() : base("mx_grid_5", "Grid 5", "MX Grid Actions") { } }
    public class Grid6Command : BaseScoreCommand { public Grid6Command() : base("mx_grid_6", "Grid 6", "MX Grid Actions") { } }
    public class Grid7Command : BaseScoreCommand { public Grid7Command() : base("mx_grid_7", "Grid 7", "MX Grid Actions") { } }
    public class Grid8Command : BaseScoreCommand { public Grid8Command() : base("mx_grid_8", "Grid 8", "MX Grid Actions") { } }
    public class TeamLocalCommand : BaseScoreCommand { public TeamLocalCommand() : base("mx_team_local", "Local Team", "MX Team Actions") { } }
    public class TeamVisitorCommand : BaseScoreCommand { public TeamVisitorCommand() : base("mx_team_visitor", "Visitor Team", "MX Team Actions") { } }
    
    public class AdTextCommand : BaseScoreCommand { 
        public AdTextCommand() : base("mx_ad_text", "Text Ad", "MX Ad Actions") { } 
        
        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            using (var bitmapBuilder = new BitmapBuilder(imageSize))
            {
                bitmapBuilder.Clear(BitmapColor.Black);
                bitmapBuilder.DrawText("TXT AD", BitmapColor.White);
                return bitmapBuilder.ToImage();
            }
        }
    }
    
    public class AdVideoCommand : BaseScoreCommand { 
        public AdVideoCommand() : base("mx_ad_video", "Video Ad", "MX Ad Actions") { } 
        
        protected override BitmapImage GetCommandImage(string actionParameter, PluginImageSize imageSize)
        {
            using (var bitmapBuilder = new BitmapBuilder(imageSize))
            {
                bitmapBuilder.Clear(BitmapColor.Black);
                bitmapBuilder.DrawText("VID AD", BitmapColor.White);
                return bitmapBuilder.ToImage();
            }
        }
    }
}
