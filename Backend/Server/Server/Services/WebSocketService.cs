using System.Net.WebSockets;
using Server.Models;
using Server.DTOs;
using Server.Mappers;
using System.Text;
using System.Text.Json;

namespace Server.Services
{
    public class WebSocketService
    {
        private readonly UnitOfWork _unitOfWork;
        private readonly UserMapper _userMapper;

        public WebSocketService(UnitOfWork unitOfWork, UserMapper userMapper)
        {
            _unitOfWork = unitOfWork;
            _userMapper = userMapper;
        }
        public async Task HandleAsync(WebSocket webSocket,User user)
        {
            // Mientras que el websocket del cliente esté conectado
            while (webSocket.State == WebSocketState.Open)
            {

                /*UserDateDto userDateDto=_userMapper.toDto(user);
                string apoyo = JsonSerializer.Serialize(userDateDto);
                byte[] bytes = Encoding.UTF8.GetBytes(apoyo);

                CancellationToken cancellation = default;
                await webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, cancellation);*/

            }
        }
        private Task SendAsync(WebSocket webSocket, string message, CancellationToken cancellation = default)
        {
            // Codificamos a bytes el contenido del mensaje
            byte[] bytes = Encoding.UTF8.GetBytes(message);

            // Enviamos los bytes al cliente marcando que el mensaje es un texto
            return webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, cancellation);
        }

    }
}
