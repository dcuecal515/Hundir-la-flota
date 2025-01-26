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

                string message = await ReadAsync(webSocket);

                // JsonConvert.DeserializeObject<ReceivedUserDto>(message);

                if (!string.IsNullOrEmpty(message))
                {
                    message = message.Substring(1, message.Length - 2); //Arreglos por recibir mal
                    message = message.Replace("\\", "");
                    Console.WriteLine("mensaje: " + message);

                    /*var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                    };
                    ReceivedUserDto prueba = new ReceivedUserDto
                    {
                        TypeMessage = "amistad",
                        Identifier ="Manuel"
                    };
                    string pruebaApoyo = JsonSerializer.Serialize(prueba);
                    Console.WriteLine("Prueba: "+pruebaApoyo+" Mensaje recibido: "+message);*/
                    ReceivedUserDto receivedUser = JsonSerializer.Deserialize<ReceivedUserDto>(message);

                    if (receivedUser.TypeMessage.Equals("amistad"))
                    {
                        string userName = receivedUser.Identifier;

                        User user2 = await _unitOfWork.UserRepository.GetByIdentifierAsync(userName);

                        if (user2 != null)
                        {
                            Request request = await _unitOfWork.RequestRepository.GetRequestByUsersId(user.Id,user2.Id);
                            if (request == null) {
                                request = new Request
                                {
                                    SenderUserId=user.Id,
                                    ReceivingUserId=user2.Id
                                };
                                await _unitOfWork.RequestRepository.InsertAsync(request);
                                await _unitOfWork.SaveAsync();

                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Se envió correctamente la solicitud"
                                };

                                string apoyo = JsonSerializer.Serialize(outMessage);

                                await SendAsync(webSocket, apoyo);
                            } else
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "No se envió la solicitud"
                                };

                                string apoyo = JsonSerializer.Serialize(outMessage);

                                await SendAsync(webSocket, apoyo);
                            }
                        } 
                    }
                }

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

        private async Task<string> ReadAsync(WebSocket webSocket, CancellationToken cancellation = default)
        {
            byte [] buffer = new byte [4096];
            StringBuilder stringBuilder = new StringBuilder();
            bool endOfMessage = false;

            do
            {
                WebSocketReceiveResult result = await webSocket.ReceiveAsync(buffer, cancellation);

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    stringBuilder.Append(message);
                }
                else if (result.CloseStatus.HasValue)
                {
                    await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, cancellation);
                }

                endOfMessage = result.EndOfMessage;
            }
            while (webSocket.State == WebSocketState.Open && !endOfMessage);

            return stringBuilder.ToString();
        }

    }
}
