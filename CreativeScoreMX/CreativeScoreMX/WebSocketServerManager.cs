using Fleck;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Loupedeck.CreativeScoreMX
{
    public class WebSocketServerManager
    {
        private static WebSocketServerManager _instance;
        private WebSocketServer _server;
        private List<IWebSocketConnection> _clients = new List<IWebSocketConnection>();
        
        public event Action<string> OnMessageReceived;

        public static WebSocketServerManager Instance
        {
            get
            {
                if (_instance == null) _instance = new WebSocketServerManager();
                return _instance;
            }
        }

        public void Start()
        {
            try
            {
                _server = new WebSocketServer("ws://127.0.0.1:8081");
                _server.Start(socket =>
                {
                    socket.OnOpen = () =>
                    {
                        Console.WriteLine("Client connected");
                        _clients.Add(socket);
                    };
                    
                    socket.OnClose = () =>
                    {
                        Console.WriteLine("Client disconnected");
                        _clients.Remove(socket);
                    };
                    
                    socket.OnMessage = message =>
                    {
                        OnMessageReceived?.Invoke(message);
                    };
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error starting WS Server: " + ex.Message);
            }
        }

        public void Stop()
        {
            if (_server != null)
            {
                _server.Dispose();
            }
            foreach (var client in _clients.ToList())
            {
                client.Close();
            }
            _clients.Clear();
        }

        public void BroadcastMessage(string message)
        {
            foreach (var client in _clients.ToList())
            {
                client.Send(message);
            }
        }
    }
}
