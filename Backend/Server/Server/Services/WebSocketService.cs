﻿using System.Net.WebSockets;
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
        private readonly IServiceProvider _serviceProvider;

        public WebSocketService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        // Lista de WebSocketHandler (clase que gestiona cada WebSocket)
        private readonly List<WebSocketHandler> _handlers = new List<WebSocketHandler>();
        // Semáforo para controlar el acceso a la lista de WebSocketHandler
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);
        public async Task HandleAsync(WebSocket webSocket, User user)
        {
            WebSocketHandler handler = await AddWebsocketAsync(webSocket, user.Id);
            await NotifyUserConnectedAsync(handler);
            await handler.HandleAsync();
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
        private async Task NotifyUserConnectedAsync(WebSocketHandler newHandler)
        {
            // Lista donde guardar las tareas de envío de mensajes
            List<Task> tasks = new List<Task>();
            // Guardamos una copia de los WebSocketHandler para evitar problemas de concurrencia
            WebSocketHandler[] handlers = _handlers.ToArray();
            int totalHandlers = handlers.Length;

            string messageToNew = $"usuarios conectados";//newHandler.Id es donde esta mi id
            string messageToOthers = $"amigo conectado";

            using (var scope = _serviceProvider.CreateScope())
            {
                var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                User myuser = await _wsHelper.GetUserById(newHandler.Id);
                if (myuser != null)
                {
                    myuser.Status = "Conectado";
                    await _wsHelper.UpdateUserAsync(myuser);
                }
                // Enviamos un mensaje personalizado al nuevo usuario y otro al resto
                foreach (WebSocketHandler handler in handlers)
                {
                    if (myuser.friends.Count>0)
                    {
                        foreach (var friend in myuser.friends)
                        {
                            if (handler.Id == friend.FriendId)
                            {

                                MessageFriendDto message = new MessageFriendDto
                                {
                                    Message = messageToOthers,
                                    FriendId = newHandler.Id,
                                    quantity = totalHandlers
                                };
                                string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                            else
                            {
                                MessageWorldDto message = new MessageWorldDto
                                {
                                    Message = messageToNew,
                                    quantity = totalHandlers
                                };
                                string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                    else
                    {
                        MessageWorldDto message = new MessageWorldDto
                        {
                            Message = messageToNew,
                            quantity = totalHandlers
                        };
                        string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                        tasks.Add(handler.SendAsync(messageToSend));
                    }
                }
            }
            // Devolvemos una tarea que se completará cuando todas las tareas de envío de mensajes se completen
            await Task.WhenAll(tasks);
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

            /*string message = $"Se ha desconectado el usuario con id {disconnectedHandler.Id}. Ahora hay {handlers.Length} usuarios conectados";*/
            using (var scope = _serviceProvider.CreateScope())
            {
                var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                User myuser = await _wsHelper.GetUserById(disconnectedHandler.Id);
                if (myuser != null)
                {
                    myuser.Status = "Desconectado";
                    await _wsHelper.UpdateUserAsync(myuser);
                }
                // Enviamos un mensaje personalizado al nuevo usuario y otro al resto
                foreach (WebSocketHandler handler in handlers)
                {
                    if (myuser.friends.Count > 0)
                    {
                        foreach (var friend in myuser.friends)
                        {
                            if (handler.Id == friend.FriendId)
                            {

                                MessageFriendDto message = new MessageFriendDto
                                {
                                    Message = "amigo desconectado",
                                    FriendId = disconnectedHandler.Id,
                                    quantity = handlers.Length
                                };
                                string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                            else
                            {
                                MessageWorldDto message = new MessageWorldDto
                                {
                                    Message = "usuarios desconectados",
                                    quantity = handlers.Length
                                };
                                string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                    else
                    {
                        MessageWorldDto message = new MessageWorldDto
                        {
                            Message = "usuarios desconectados",
                            quantity = handlers.Length
                        };
                        string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                        tasks.Add(handler.SendAsync(messageToSend));
                    }
                }
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

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        Request request = await _wsHelper.GetRequestByUsersId(user.Id, user2.Id);
                        if (request == null)
                        {
                            bool isFriend = _wsHelper.GetIfUsersAreFriends(user, user2);
                            if (!isFriend)
                            {
                                request = new Request
                                {
                                    SenderUserId = user.Id,
                                    ReceivingUserId = user2.Id
                                };
                                await _wsHelper.InsertRequestAsync(request);

                                foreach (WebSocketHandler handler in handlers)
                                {
                                    if (handler.Id == userHandler.Id)
                                    {
                                        WebsocketMessageDto outMessage = new WebsocketMessageDto
                                        {
                                            Message = "Se envió correctamente la solicitud"
                                        };
                                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend));
                                    } else if (handler.Id == user2.Id)
                                    {
                                        UserDateDto outMessage = new UserDateDto
                                        {
                                            Id = user.Id,
                                            NickName = user.NickName,
                                            Avatar = user.Avatar,
                                            Message = "Has recibido una solicitud de amistad"
                                        };
                                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend));
                                    }

                                }
                            }
                        } else
                        {
                            WebsocketMessageDto outMessage = new WebsocketMessageDto
                            {
                                Message = "No se envió la solicitud"
                            };

                            string apoyo = JsonSerializer.Serialize(outMessage,JsonSerializerOptions.Web);

                            tasks.Add(userHandler.SendAsync(apoyo));
                        }
                    }
                }

                
            }
            if (receivedUser.TypeMessage.Equals("rechazar"))
            {
                string userName = receivedUser.Identifier;
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        Request request = await _wsHelper.GetRequestByUsersId(user.Id, user2.Id);
                        if (request != null)
                        {
                            await _wsHelper.DeleteRequestAsync(request);
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == user2.Id)
                                {
                                    WebsocketMessageDto outMessage = new WebsocketMessageDto
                                    {
                                        Message = "Te rechazaron"
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage,JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend));
                                }
                            }
                        }
                    }

                }
            }
            if (receivedUser.TypeMessage.Equals("aceptar"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    var _userMapper = scope.ServiceProvider.GetRequiredService<UserMapper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        Request request = await _wsHelper.GetRequestByUsersId(user.Id, user2.Id);
                        if (request != null)
                        {
                            bool isFriend = _wsHelper.GetIfUsersAreFriends(user,user2);
                            if (!isFriend)
                            {
                                var user1NewFriend = new Friend { FriendId = user2.Id };
                                var user2NewFriend = new Friend { FriendId = user.Id };
                                user.friends.Add(user1NewFriend);
                                user2.friends.Add(user2NewFriend);
                                await _wsHelper.UpdateUserAsync(user);
                                await _wsHelper.UpdateUserAsync(user2);
                                await _wsHelper.DeleteRequestAsync(request);

                                foreach (WebSocketHandler handler in handlers)
                                {
                                    if (handler.Id == userHandler.Id)
                                    {
                                        SendFriendDto outMessage = _userMapper.toSendFriendDto(user2);
                                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend));
                                    } else if (handler.Id == user2.Id)
                                    {
                                        SendFriendDto outMessage = _userMapper.toSendFriendDto(user);
                                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend));
                                    }

                                }

                            }
                        }
                    }
                }
            }
            if (receivedUser.TypeMessage.Equals("eliminar"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        bool isFriend = _wsHelper.GetIfUsersAreFriends(user, user2);
                        if (isFriend)
                        {
                            var user1Friend = user.friends.FirstOrDefault(friend => friend.FriendId == user2.Id);
                            var user2Friend = user2.friends.FirstOrDefault(friend => friend.FriendId == user.Id);
                            if (user1Friend != null && user2Friend != null)
                            {
                                await _wsHelper.DeleteFrienshipByUsers(user,user2);
                                user.friends.Remove(user1Friend);
                                user2.friends.Remove(user2Friend);
                                await _wsHelper.UpdateUserAsync(user);
                                await _wsHelper.UpdateUserAsync(user2);

                                foreach (WebSocketHandler handler in handlers)
                                {
                                    if (handler.Id == user2.Id)
                                    {
                                        DeleteDto outMessage = new DeleteDto
                                        {
                                            Message = "Has sido eliminado de amigos",
                                            NickName = user.NickName
                                        };
                                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend));
                                    }

                                }
                            }
                        }
                    }
                }

            }


            await Task.WhenAll(tasks);
        }



    }
}
