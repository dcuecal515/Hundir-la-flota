using System.Net.WebSockets;
using Server.Models;
using Server.DTOs;
using Server.Mappers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Protocol;

namespace Server.Services
{
    public class WebSocketService
    {
        private readonly WSHelper _wsHelper;
        private readonly UserMapper _userMapper;

        public WebSocketService(WSHelper wsHelper, UserMapper userMapper)
        {
            _wsHelper = wsHelper;
            _userMapper = userMapper;
        }
        // Lista de WebSocketHandler (clase que gestiona cada WebSocket)
        private readonly List<WebSocketHandler> _handlers = new List<WebSocketHandler>();
        // Semáforo para controlar el acceso a la lista de WebSocketHandler
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);
        public async Task HandleAsync(WebSocket webSocket,User user)
        {
            WebSocketHandler handler = await AddWebsocketAsync(webSocket,user.Id);
            await NotifyUserConnectedAsync(handler);
            await handler.HandleAsync();

            // Mientras que el websocket del cliente esté conectado
            

                // string message = await ReadAsync(webSocket);

                // JsonConvert.DeserializeObject<ReceivedUserDto>(message);

                /*if (!string.IsNullOrEmpty(message))
                {
                    message = message.Substring(1, message.Length - 2); //Arreglos por recibir mal
                    message = message.Replace("\\", "");
                    Console.WriteLine("mensaje: " + message);*/

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

                    //ReceivedUserDto receivedUser = JsonSerializer.Deserialize<ReceivedUserDto>(message);

                    //Esto no se borraria por ahora
                    /*if (receivedUser.TypeMessage.Equals("amistad"))
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
                    }*/
                   
                //}

                /*UserDateDto userDateDto=_userMapper.toDto(user);
                string apoyo = JsonSerializer.Serialize(userDateDto);
                byte[] bytes = Encoding.UTF8.GetBytes(apoyo);

                CancellationToken cancellation = default;
                await webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, cancellation);*/
            
        }
        private async Task<WebSocketHandler> AddWebsocketAsync(WebSocket webSocket,int id)
        {
            // Esperamos a que haya un hueco disponible
            await _semaphore.WaitAsync();

            // Sección crítica
            // Creamos un nuevo WebSocketHandler, nos suscribimos a sus eventos y lo añadimos a la lista
            WebSocketHandler handler = new WebSocketHandler(id, webSocket);
            handler.Disconnected += OnDisconnectedAsync;
            handler.MessageReceived += OnMessageReceivedAsync;
            _handlers.Add(handler);

            // Liberamos el semáforo
            _semaphore.Release();

            return handler;
        }
        private Task NotifyUserConnectedAsync(WebSocketHandler newHandler)
        {
            // Lista donde guardar las tareas de envío de mensajes
            List<Task> tasks = new List<Task>();
            // Guardamos una copia de los WebSocketHandler para evitar problemas de concurrencia
            WebSocketHandler[] handlers = _handlers.ToArray();
            int totalHandlers = handlers.Length;

            string messageToNew = $"Hay {totalHandlers} usuarios conectados, tu id es {newHandler.Id}";
            WebsocketMessageDto websocketMessageDto = new WebsocketMessageDto { Message = messageToNew };
            string messageConnected = JsonSerializer.Serialize(websocketMessageDto);
            string messageToOthers = $"Se ha conectado usuario con id {newHandler.Id}. En total hay {totalHandlers} usuarios conectados";
            WebsocketMessageDto websocketMessageDto2 = new WebsocketMessageDto { Message = messageToOthers };
            string messageWorld = JsonSerializer.Serialize(websocketMessageDto2);

            // Enviamos un mensaje personalizado al nuevo usuario y otro al resto
            foreach (WebSocketHandler handler in handlers)
            {
                string message = handler.Id == newHandler.Id ? messageConnected : messageWorld;

                tasks.Add(handler.SendAsync(message));
            }

            // Devolvemos una tarea que se completará cuando todas las tareas de envío de mensajes se completen
            return Task.WhenAll(tasks);
        }

        private async Task OnDisconnectedAsync(WebSocketHandler disconnectedHandler)
        {
            // Esperamos a que haya un hueco disponible
            await _semaphore.WaitAsync();

            // Sección crítica
            // Nos desuscribimos de los eventos y eliminamos el WebSocketHandler de la lista
            disconnectedHandler.Disconnected -= OnDisconnectedAsync;
            disconnectedHandler.MessageReceived -= OnMessageReceivedAsync;
            _handlers.Remove(disconnectedHandler);

            // Liberamos el semáforo
            _semaphore.Release();

            // Lista donde guardar las tareas de envío de mensajes
            List<Task> tasks = new List<Task>();
            // Guardamos una copia de los WebSocketHandler para evitar problemas de concurrencia
            WebSocketHandler[] handlers = _handlers.ToArray();

            string message = $"Se ha desconectado el usuario con id {disconnectedHandler.Id}. Ahora hay {handlers.Length} usuarios conectados";

            // Enviamos el mensaje al resto de usuarios
            foreach (WebSocketHandler handler in handlers)
            {
                tasks.Add(handler.SendAsync(message));
            }

            // Esperamos a que todas las tareas de envío de mensajes se completen
            await Task.WhenAll(tasks);
        }

        private async Task OnMessageReceivedAsync(WebSocketHandler userHandler, string message)
        {
            // Lista donde guardar las tareas de envío de mensajes
            List<Task> tasks = new List<Task>();
            // Guardamos una copia de los WebSocketHandler para evitar problemas de concurrencia
            WebSocketHandler[] handlers = _handlers.ToArray();

            /*string messageToMe = $"Tú: {message}";
            string messageToOthers = $"Usuario {userHandler.Id}: {message}";*/
            message = message.Substring(1, message.Length - 2); //Arreglos por recibir mal
            message = message.Replace("\\", "");

            ReceivedUserDto receivedUser = JsonSerializer.Deserialize<ReceivedUserDto>(message);

            if (receivedUser.TypeMessage.Equals("amistad"))
            {
                string userName = receivedUser.Identifier;

                User user = await _wsHelper.GetUserById(userHandler.Id);
                User user2 = await _wsHelper.GetUserByNickname(userName);

                if (user2 != null)
                {
                    Request request = await _wsHelper.GetRequestByUsersId(user.Id, user2.Id);
                    if (request == null)
                    {
                        request = new Request
                        {
                            SenderUserId = user.Id,
                            ReceivingUserId = user2.Id
                        };
                        await _wsHelper.InsertRequestAsync(request);

                        foreach (WebSocketHandler handler in handlers)
                        {
                            if(handler.Id == userHandler.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Se envió correctamente la solicitud"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                            else if(handler.Id == user2.Id)
                            {
                                UserDateDto outMessage = new UserDateDto
                                {
                                    Id = user2.Id,
                                    NickName = user2.NickName,
                                    Avatar = user2.Avatar,
                                    Message = "Has recibido una solicitud de "+user2.NickName
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                            
                        }
                    } else
                    {
                        WebsocketMessageDto outMessage = new WebsocketMessageDto
                        {
                            Message = "No se envió la solicitud"
                        };

                        string apoyo = JsonSerializer.Serialize(outMessage);

                        tasks.Add(userHandler.SendAsync(apoyo));
                    }
                }
            }

            await Task.WhenAll(tasks);
        }



    }
}
