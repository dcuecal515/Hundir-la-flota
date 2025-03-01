using System.Net.WebSockets;
using Server.Models;
using Server.DTOs;
using Server.Mappers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Protocol;
using System.Numerics;
using System.Timers;
using Timer = System.Timers.Timer;
using System;
using System.Text.RegularExpressions;
using System.Diagnostics.Contracts;

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
        private readonly List<WebSocketHandler> _players = new List<WebSocketHandler>();
        private readonly List<Partida> _partidas = new List<Partida>();
        private readonly List<PartidaBot> _partidasbot = new List<PartidaBot>();
        // Semáforo para controlar el acceso a la lista de WebSocketHandler
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1);
        private readonly SemaphoreSlim _semaphoreplayers=new SemaphoreSlim(1);
        private readonly SemaphoreSlim _semaphoreplayerdisconnect = new SemaphoreSlim(1);
        private readonly SemaphoreSlim _Semaphorepalyerbotdesconnect = new SemaphoreSlim(1);
        // Temporizadores de partidas
        private Dictionary<int, Timer> _timers = new Dictionary<int, Timer>();
        // Barcos de jugadores
        private Dictionary<int, string[][]> _ships = new Dictionary<int, string[][]>();
        private Dictionary<int, string[][]> _botShips = new Dictionary<int, string[][]>();
        // Disparos guardados por cada bot
        private Dictionary<int, string []> _botShoots = new Dictionary<int, string []>();
        //Contadores de tiempo de partida 
        private Dictionary<int, DateTime> _startedTime = new Dictionary<int, DateTime>();

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
            PartidaBot[] partidabot = _partidasbot.ToArray();
            Partida[] partidas = _partidas.ToArray();
            int totalHandlers = handlers.Length;
            int totalpartidabot = partidabot.Length;
            int totalpartidas = partidas.Length;

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
                                    quantity = totalHandlers,
                                    quantitygame= totalpartidabot+totalpartidas,
                                    quantityplayer=totalpartidabot+(totalpartidas*2)
                                };
                                string messageToSend = JsonSerializer.Serialize(message, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                            else
                            {
                                MessageWorldDto message = new MessageWorldDto
                                {
                                    Message = messageToNew,
                                    quantity = totalHandlers,
                                    quantitygame = totalpartidabot + totalpartidas,
                                    quantityplayer = totalpartidabot + (totalpartidas * 2)
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
                            quantity = totalHandlers,
                            quantitygame = totalpartidabot + totalpartidas,
                            quantityplayer = totalpartidabot + (totalpartidas * 2)
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
            PartidaBot[] partidabot = _partidasbot.ToArray();
            Partida[] partidas = _partidas.ToArray();

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
                                    quantity = handlers.Length,
                                    quantitygame = partidabot.Length + partidas.Length,
                                    quantityplayer = partidabot.Length + (partidas.Length * 2)
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
                            quantity = handlers.Length,
                            quantitygame = partidabot.Length + partidas.Length,
                            quantityplayer = partidabot.Length + (partidas.Length * 2)
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
            // Console.WriteLine(message);
            message = message.Substring(1, message.Length - 2); //Arreglos por recibir mal
            message = message.Replace("@", "&_&_&_&"); // Para los verdaderos emails
            message = message.Replace("\\\\", "@"); // Para los arrays de barcos
            message = message.Replace("\\", "");
            message = message.Replace("@", "\\");
            message = message.Replace("&_&_&_&", "@");
            // Console.WriteLine(message);

            // ReceivedUserDto ejemplo = new ReceivedUserDto { TypeMessage = "Mis barcos contra bot", Identifier = "[[\"a1\", \"a2\"], [\"b1\", \"b2\", \"b3\"]]" };

            // string ejemploTransformado = JsonSerializer.Serialize<ReceivedUserDto>(ejemplo);

            // Console.WriteLine(ejemploTransformado);

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
            if (receivedUser.TypeMessage.Equals("solicitud de partida"))
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
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == user2.Id)
                                {
                                    UserDateDto outMessage = new UserDateDto
                                    {
                                        Id = user.Id,
                                        NickName = user.NickName,
                                        Avatar = user.Avatar,
                                        Message = "Has recibido una solicitud de partida"
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend));
                                }

                            }
                        }
                    }
                }
            }
            if(receivedUser.TypeMessage.Equals("Buscando Partida"))
            {

                //Espero para el semaforo
                await _semaphoreplayers.WaitAsync();
                if(_players.Count > 0)
                {
                    var exist=_players.Contains(userHandler);
                    if (exist)
                    {
                        WebsocketMessageDto outMessage = new WebsocketMessageDto
                        {
                            Message = "Estas ya en la lista de busqueda"
                        };
                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                        tasks.Add(userHandler.SendAsync(messageToSend));
                    }
                    else
                    {
                        _players.Add(userHandler);
                    }
                }
                else
                {
                    _players.Add(userHandler);
                }
                    if (_players.Count == 2)
                    {
                        WebSocketHandler[] players = _players.ToArray();
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                            var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();

                            foreach (WebSocketHandler player in players)
                            {
                                

                                if (userHandler.Id != player.Id)
                                {
                                    User user = await _wsHelper.GetUserById(player.Id);
                                    user.Status = "Jugando";
                                    await _wsHelper.UpdateUserAsync(user);
                                    foreach (var friend in user.friends)
                                    {
                                        foreach (WebSocketHandler handler in handlers)
                                        {
                                            if (handler.Id == friend.FriendId)
                                            {
                                                DeleteDto outMessage2 = new DeleteDto
                                                {
                                                    Message = "Tu amigo esta jugando",
                                                    NickName = user.NickName
                                                };
                                                string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                                tasks.Add(handler.SendAsync(messageToSend2));
                                            }
                                        }
                                    }
                                    StartGameDto outMessage = new StartGameDto
                                    {
                                        Message = "Partida Aleatoria Encontrada",
                                        OpponentId = players [1].Id
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(player.SendAsync(messageToSend));
                                } else
                                {
                                    User user = await _wsHelper.GetUserById(player.Id);
                                    user.Status = "Jugando";
                                    await _wsHelper.UpdateUserAsync(user);
                                    foreach (var friend in user.friends)
                                    {
                                        foreach (WebSocketHandler handler in handlers)
                                        {
                                            if (handler.Id == friend.FriendId)
                                            {
                                                DeleteDto outMessage2 = new DeleteDto
                                                {
                                                    Message = "Tu amigo esta jugando",
                                                    NickName = user.NickName
                                                };
                                                string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                                tasks.Add(handler.SendAsync(messageToSend2));
                                            }
                                        }
                                    }
                                    StartGameDto outMessage = new StartGameDto
                                    {
                                        Message = "Partida Aleatoria Encontrada",
                                        OpponentId = players [0].Id
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(player.SendAsync(messageToSend));
                                }

                            }
                            StartGameTimer(userHandler.Id, userHandler);
                            Game game = await _gameService.CreateGame(0);
                            Partida nuevaPartida = new Partida(game.Id, players[0], players[1]);
                            await _semaphoreplayerdisconnect.WaitAsync();
                            _partidas.Add(nuevaPartida);
                            _startedTime [game.Id] = DateTime.Now;
                            _semaphoreplayerdisconnect.Release();
                        }
                        _players.Clear();
                    }

                //Liberamos el semaforo
                _semaphoreplayers.Release();
            }

            if (receivedUser.TypeMessage.Equals("Envio de oponentes"))
            {
                
                foreach (WebSocketHandler handler in handlers)
                {
                    if (handler.Id == Int32.Parse(receivedUser.Identifier))
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                            User user = await _wsHelper.GetUserById(userHandler.Id);

                            DeleteDto outMessage = new DeleteDto
                            {
                                Message = "Datos iniciales",
                                NickName = user.NickName
                            };
                            string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                            tasks.Add(handler.SendAsync(messageToSend));
                        }
                    }

                }
                
            }

            if (receivedUser.TypeMessage.Equals("Cancelar busqueda de partida"))
            {
                
                if (_players.Contains(userHandler))
                {
                    _players.Remove(userHandler);
                }
                WebsocketMessageDto outMessage = new WebsocketMessageDto
                {
                    Message = "Busqueda cancelada"
                };
                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                tasks.Add(userHandler.SendAsync(messageToSend));
            }

            if (receivedUser.TypeMessage.Equals("solicitud de partida contra bot"))
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    user.Status = "Jugando";
                    await _wsHelper.UpdateUserAsync(user);
                    foreach (var friend in user.friends)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == friend.FriendId)
                            {
                                DeleteDto outMessage2 = new DeleteDto
                                {
                                    Message = "Tu amigo esta jugando",
                                    NickName = user.NickName
                                };
                                string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend2));
                            }
                        }
                    }
                    Game game = await _gameService.CreateGame(0);
                    PartidaBot nuevapartida = new PartidaBot(game.Id, userHandler);
                    await _Semaphorepalyerbotdesconnect.WaitAsync();
                    _partidasbot.Add(nuevapartida);
                    _startedTime[game.Id] = DateTime.Now;
                    _Semaphorepalyerbotdesconnect.Release();
                    Partida[] partidas = _partidas.ToArray();
                    PartidaBot[] partidabot = _partidasbot.ToArray();
                    foreach (WebSocketHandler handler in handlers)
                    {
                        PlayersInGameMessage outMessage4 = new PlayersInGameMessage
                        {
                            Message = "Jugadores jugando",
                            quantitygame = partidabot.Length + partidas.Length,
                            quantityplayer = partidabot.Length + (partidas.Length * 2)
                        };
                        string messageToSend3 = JsonSerializer.Serialize(outMessage4, JsonSerializerOptions.Web);
                        tasks.Add(handler.SendAsync(messageToSend3));
                    }
                }
                StartGameTimer(userHandler.Id, userHandler);

                WebsocketMessageDto outMessage = new WebsocketMessageDto
                {
                    Message = "Partida Encontrada"
                };
                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                tasks.Add(userHandler.SendAsync(messageToSend));
            }

            if (receivedUser.TypeMessage.Equals("sala finalizada"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                UserDateDto outMessage = new UserDateDto
                                {
                                    Id = user.Id,
                                    NickName = user.NickName,
                                    Avatar = user.Avatar,
                                    Message = "Se finalizo la partida"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }

                        }
                    }
                }
            }

            if (receivedUser.TypeMessage.Equals("Aceptar Partida"))
            {
                string userName = receivedUser.Identifier;
                
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    
                    if (user2 != null)
                    { 
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                UserDateDto outMessage = new UserDateDto
                                {
                                    Id = user.Id,
                                    NickName = user.NickName,
                                    Avatar = user.Avatar,
                                    Message = "Se unieron a tu lobby"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                                
                            }
                            if(handler.Id == user.Id)
                            {
                                UserDateDto outMessage = new UserDateDto
                                {
                                    Id = user2.Id,
                                    NickName = user2.NickName,
                                    Avatar = user2.Avatar,
                                    Message = "Te uniste a una lobby"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if (receivedUser.TypeMessage.Equals("Rechazar Partida"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                DeleteDto outMessage = new DeleteDto
                                {
                                    NickName = user.NickName,
                                    Message = "Te rechazo la partida"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if (receivedUser.TypeMessage.Equals("Abandono invitado"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                DeleteDto outMessage = new DeleteDto
                                {
                                    NickName = user.NickName,
                                    Message = "Se salieron de tu lobby"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if (receivedUser.TypeMessage.Equals("Abandono anfitrion"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                DeleteDto outMessage = new DeleteDto
                                {
                                    NickName = user.NickName,
                                    Message = "Te volviste anfitrion"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if (receivedUser.TypeMessage.Equals("Empezar partida"))
            {
                string userName = receivedUser.Identifier;
                List<WebSocketHandler> _jugadores = new List<WebSocketHandler>();
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);

                    if (user2 != null)
                    {
                        user.Status = "Jugando";
                        user2.Status = "Jugando";
                        await _wsHelper.UpdateUserAsync(user);
                        await _wsHelper.UpdateUserAsync(user2);

                        foreach (var friend in user.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo esta jugando",
                                        NickName = user.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }

                        foreach (var friend in user2.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo esta jugando",
                                        NickName = user2.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }

                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                StartGameDto outMessage = new StartGameDto
                                {
                                    Message = "Empezo la partida",
                                    OpponentId = user.Id
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                _jugadores.Add(userHandler);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                            if (handler.Id == user.Id)
                            {
                                StartGameDto outMessage = new StartGameDto
                                {
                                    Message = "Empezo la partida",
                                    OpponentId = user2.Id
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                _jugadores.Add(userHandler);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                    /*
                     StartGameTimer(player.Id, player);
                            Game game = await _gameService.CreateGame(0);
                            Partida nuevaPartida = new Partida(game.Id, players [0], players [1]);
                            await _semaphoreplayerdisconnect.WaitAsync();
                            _partidas.Add(nuevaPartida);
                            _startedTime [game.Id] = DateTime.Now;
                            _semaphoreplayerdisconnect.Release();
                     */
                    StartGameTimer(_jugadores [0].Id, _jugadores[0]);
                    Game game = await _gameService.CreateGame(0);
                    Partida nuevaPartida = new Partida(game.Id, _jugadores[0], _jugadores[1]);
                    await _semaphoreplayerdisconnect.WaitAsync();
                    _partidas.Add(nuevaPartida);
                    _startedTime[game.Id] = DateTime.Now;
                    _semaphoreplayerdisconnect.Release();

                }
                Partida[] partidas = _partidas.ToArray();
                PartidaBot[] partidabot = _partidasbot.ToArray();
                foreach (WebSocketHandler handler in handlers)
                {
                    PlayersInGameMessage outMessage3 = new PlayersInGameMessage
                    {
                        Message = "Jugadores jugando",
                        quantitygame = partidabot.Length + partidas.Length,
                        quantityplayer = partidabot.Length + (partidas.Length * 2)
                    };
                    string messageToSend3 = JsonSerializer.Serialize(outMessage3, JsonSerializerOptions.Web);
                    tasks.Add(handler.SendAsync(messageToSend3));
                }
                
            }
            if (receivedUser.TypeMessage.Equals("Abandono de partida"))
            {
                string userName = receivedUser.Identifier;
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    StopGameTimer(user.Id);
                    if (user2 != null)
                    {
                        user.Status = "Conectado";
                        user2.Status = "Conectado";
                        await _wsHelper.UpdateUserAsync(user);
                        await _wsHelper.UpdateUserAsync(user2);
                        foreach (var friend in user.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                        foreach (var friend in user2.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user2.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                        StopGameTimer(user2.Id);
                        int partidausuario = _partidas.FirstOrDefault(p => p.Player1.Id == user.Id || p.Player2.Id == user.Id).GameId;
                        TimeSpan timeSpan = DateTime.Now - _startedTime [partidausuario];
                        double timeFinished =  timeSpan.TotalSeconds;
                        Game game = await _gameService.GetGameById (partidausuario);
                        game.Time = timeFinished;
                        _startedTime.Remove(partidausuario);

                        // Usuario ganador
                        GameInfo gameInfo = new GameInfo();
                        gameInfo.GameId = partidausuario;
                        gameInfo.State = "Victoria";
                        gameInfo.Score = 60;
                        gameInfo.UserId = user2.Id;
                        await _gameService.createGameInfo(gameInfo);
                        user2.gameInfos.Add(gameInfo);
                        await _wsHelper.UpdateUserAsync(user2);

                        // Usuario perdedor
                        GameInfo gameInfo2 = new GameInfo();
                        gameInfo2.GameId = partidausuario;
                        gameInfo2.State = "Derrota";
                        gameInfo2.Score = 0;
                        gameInfo2.UserId = user.Id;
                        await _gameService.createGameInfo(gameInfo2);
                        user.gameInfos.Add(gameInfo2);
                        await _wsHelper.UpdateUserAsync(user);

                        game.gameInfos.Add(gameInfo);
                        game.gameInfos.Add(gameInfo2);
                        await _gameService.UpdateGameAsync(game);

                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Has ganado"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                                await _semaphoreplayerdisconnect.WaitAsync();
                            }
                            if (handler.Id == user.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Has perdido"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                        await _semaphoreplayerdisconnect.WaitAsync();
                        var partida = _partidas.FirstOrDefault(p => p.Player1.Id == userHandler.Id || p.Player2.Id == userHandler.Id);
                        _partidas.Remove(partida);
                        _semaphoreplayerdisconnect.Release();
                        Partida[] partidas = _partidas.ToArray();
                        PartidaBot[] partidabot = _partidasbot.ToArray();
                        foreach (WebSocketHandler handler in handlers)
                        {
                            PlayersInGameMessage outMessage3 = new PlayersInGameMessage
                            {
                                Message = "Jugadores jugando",
                                quantitygame = partidabot.Length + partidas.Length,
                                quantityplayer = partidabot.Length + (partidas.Length * 2)
                            };
                            string messageToSend3 = JsonSerializer.Serialize(outMessage3, JsonSerializerOptions.Web);
                            tasks.Add(handler.SendAsync(messageToSend3));
                        }
                    }
                    else
                    {
                        StopGameTimer(user.Id);
                        int partidausuario = _partidasbot.FirstOrDefault(p => p.Player1.Id == user.Id).GameId;
                        TimeSpan timeSpan = DateTime.Now - _startedTime [partidausuario];
                        double timeFinished = timeSpan.TotalSeconds;
                        Game game = await _gameService.GetGameById(partidausuario);
                        game.Time = timeFinished;
                        _startedTime.Remove(partidausuario);

                        // Usuario perdedor
                        GameInfo gameInfo = new GameInfo();
                        gameInfo.GameId = partidausuario;
                        gameInfo.State = "Derrota";
                        gameInfo.Score = 0;
                        gameInfo.UserId = user.Id;
                        await _gameService.createGameInfo(gameInfo);
                        user.gameInfos.Add(gameInfo);
                        await _wsHelper.UpdateUserAsync(user);

                        await _Semaphorepalyerbotdesconnect.WaitAsync();
                        var partida = _partidasbot.FirstOrDefault(h => h.Player1.Id == userHandler.Id);
                        _partidasbot.Remove(partida);
                        _Semaphorepalyerbotdesconnect.Release();
                        user.Status = "Conectado";
                        await _wsHelper.UpdateUserAsync(user);

                        game.gameInfos.Add(gameInfo);
                        await _gameService.UpdateGameAsync(game);

                        foreach (var friend in user.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                        Partida[] partidas = _partidas.ToArray();
                        PartidaBot[] partidabot = _partidasbot.ToArray();
                        foreach (WebSocketHandler handler in handlers)
                        {
                            PlayersInGameMessage outMessage4 = new PlayersInGameMessage
                            {
                                Message = "Jugadores jugando",
                                quantitygame = partidabot.Length + partidas.Length,
                                quantityplayer = partidabot.Length + (partidas.Length * 2)
                            };
                            string messageToSend3 = JsonSerializer.Serialize(outMessage4, JsonSerializerOptions.Web);
                            tasks.Add(handler.SendAsync(messageToSend3));
                        }
                    }
                }
            }
            

            if (receivedUser.TypeMessage.Equals("Disparo"))
            {
                string userName = receivedUser.Identifier;
                StopGameTimer(userHandler.Id);
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        List<List<string>> Ships = _ships [user2.Id].Select(ship => ship.ToList()).ToList();
                        bool shooterWins = false;
                        bool shootImpact = false;

                        List<List<string>> shipsToRemove = new List<List<string>>();

                        // Comprueba si el bot impacta un barco del usuario
                        foreach (var ship in Ships)
                        {
                            foreach (var pos in ship)
                            {
                                if (pos == receivedUser.Identifier2)
                                {
                                    shootImpact = true;
                                    ship.Remove(pos);

                                    if (ship.Count == 0)
                                    {
                                        shipsToRemove.Add(ship);
                                    }
                                    break;
                                }
                            }
                        }

                        // Eliminar barcos vacíos después del bucle
                        foreach (var ship in shipsToRemove)
                        {
                            Ships.Remove(ship);
                        }

                        // Verificar si el bot gana
                        if (Ships.Count == 0)
                        {
                            shooterWins = true;
                        }

                        // Guarda los cambios
                        _ships [user2.Id] = Ships.Select(ship => ship.ToArray()).ToArray();

                        if (shooterWins)
                        {
                            foreach (var friend in user.friends)
                            {
                                foreach (WebSocketHandler handler in handlers)
                                {
                                    if (handler.Id == friend.FriendId)
                                    {
                                        DeleteDto outMessage2 = new DeleteDto
                                        {
                                            Message = "Tu amigo dejo de jugar",
                                            NickName = user.NickName
                                        };
                                        string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend2));
                                    }
                                }
                            }
                            foreach (var friend in user2.friends)
                            {
                                foreach (WebSocketHandler handler in handlers)
                                {
                                    if (handler.Id == friend.FriendId)
                                    {
                                        DeleteDto outMessage2 = new DeleteDto
                                        {
                                            Message = "Tu amigo dejo de jugar",
                                            NickName = user2.NickName
                                        };
                                        string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                        tasks.Add(handler.SendAsync(messageToSend2));
                                    }
                                }
                            }

                            int partidausuario = _partidas.FirstOrDefault(p => p.Player1.Id == userHandler.Id || p.Player2.Id == userHandler.Id).GameId;
                            TimeSpan timeSpan = DateTime.Now - _startedTime [partidausuario];
                            double timeFinished = timeSpan.TotalSeconds;
                            Game game = await _gameService.GetGameById(partidausuario);
                            game.Time = timeFinished;
                            _startedTime.Remove(partidausuario);

                            // Usuario ganador
                            GameInfo gameInfo = new GameInfo();
                            gameInfo.GameId = partidausuario;
                            gameInfo.State = "Victoria";
                            gameInfo.Score = 60;
                            gameInfo.UserId = user.Id;
                            await _gameService.createGameInfo(gameInfo);
                            user.gameInfos.Add(gameInfo);
                            await _wsHelper.UpdateUserAsync(user);

                            // Usuario perdedor
                            GameInfo gameInfo2 = new GameInfo();
                            gameInfo2.GameId = partidausuario;
                            gameInfo2.State = "Derrota";
                            int cont = 0;
                            foreach (var ship in _ships [user.Id])
                            {
                                cont += ship.Length;
                            }
                            int score = 60 - (cont * 5);
                            gameInfo2.Score = score;
                            gameInfo2.UserId = user2.Id;
                            await _gameService.createGameInfo(gameInfo2);
                            user2.gameInfos.Add(gameInfo2);
                            await _wsHelper.UpdateUserAsync(user2);

                            game.gameInfos.Add(gameInfo);
                            game.gameInfos.Add(gameInfo2);
                            await _gameService.UpdateGameAsync(game);

                            await _semaphoreplayerdisconnect.WaitAsync();
                                var partida = _partidas.FirstOrDefault(p => p.Player1.Id==userHandler.Id||p.Player2.Id==userHandler.Id);
                                _partidas.Remove(partida);
                            _semaphoreplayerdisconnect.Release();

                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == user2.Id)
                                {
                                    FinishGameMessageDto outMessage = new FinishGameMessageDto
                                    {
                                        Message = "Has perdido la partida",
                                        YourScore = score,
                                        OpponentScore = 60,
                                        Position = receivedUser.Identifier2
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend));
                                }
                                if (handler.Id == user.Id)
                                {
                                    FinishGameMessageDto outMessage = new FinishGameMessageDto
                                    {
                                        Message = "Has ganado la parida",
                                        YourScore = 60,
                                        OpponentScore = score,
                                        Position = receivedUser.Identifier2
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend));
                                }
                            }

                            Partida [] partidas = _partidas.ToArray();
                            PartidaBot[] partidabot = _partidasbot.ToArray();
                            foreach (WebSocketHandler handler in handlers)
                            {
                                PlayersInGameMessage outMessage = new PlayersInGameMessage
                                {
                                    Message = "Jugadores jugando",
                                    quantitygame = partidabot.Length + partidas.Length,
                                    quantityplayer = partidabot.Length + (partidas.Length * 2)
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        } else
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == user2.Id)
                                {
                                    ShootSenderDto outMessage = new ShootSenderDto
                                    {
                                        Message = "Disparo enemigo",
                                        Position = receivedUser.Identifier2,
                                        Impacted = shootImpact
                                    };
                                    StartGameTimer(user2.Id, handler);
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend));
                                }
                                if(handler.Id == user.Id)
                                {
                                    ShootSenderDto outMessage = new ShootSenderDto
                                    {
                                        Message = "Tu disparo ha sido enviado",
                                        Position = receivedUser.Identifier2,
                                        Impacted = shootImpact
                                    };
                                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend));
                                }
                            }
                        }
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("He colocado mis barcos"))
            {
                string userName = receivedUser.Identifier;
                StopGameTimer(userHandler.Id);
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        string [] [] ships = JsonSerializer.Deserialize<string [] []>(receivedUser.Identifier2);
                        _ships [userHandler.Id] = ships;
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Tu oponente coloco los barcos primero"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("Yo tambien los coloque"))
            {
                string userName = receivedUser.Identifier;
                StopGameTimer(userHandler.Id);
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        string [] [] ships = JsonSerializer.Deserialize<string [] []>(receivedUser.Identifier2);
                        _ships [userHandler.Id] = ships;
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Empiezas tu"
                                };
                                StartGameTimer(user2.Id, handler);
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }
            if (receivedUser.TypeMessage.Equals("Mensaje de texto")) {
                string userName = receivedUser.Identifier;
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Te llego un mensaje",
                                    MessageToOpponent = receivedUser.Identifier2
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("Mis barcos contra bot"))
            {
                StopGameTimer(userHandler.Id);
                string [][] ships = JsonSerializer.Deserialize<string [] []>(receivedUser.Identifier);
                /*foreach (var ship in ships)
                {
                    Console.WriteLine(string.Join(", ", ship));
                }*/
                _ships [userHandler.Id] = ships;
                string [][] botShips = GenerateBotShips();
                /*foreach (var ship in botShips)
                {
                    Console.WriteLine(string.Join(", ", ship));
                }*/
                _botShips [userHandler.Id] = botShips;

                WebsocketMessageDto outMessage = new WebsocketMessageDto
                {
                    Message = "Ya estan los barcos"
                };
                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                StartGameTimer(userHandler.Id, userHandler);
                tasks.Add(userHandler.SendAsync(messageToSend));

            }

            if(receivedUser.TypeMessage.Equals("Disparo a bot"))
            {
                // Para el temporizador
                StopGameTimer(userHandler.Id);

                // Declaración de variables
                bool yourImpacted = false;
                bool botImpacted = false;
                bool youWin = false;
                bool botWin = false;
                Random random = new Random();
                List<List<string>> botShips = _botShips [userHandler.Id].Select(ship => ship.ToList()).ToList();
                List<List<string>> Ships = _ships [userHandler.Id].Select(ship => ship.ToList()).ToList();
                string [] chars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

                if (!_botShoots.ContainsKey(userHandler.Id))
                {
                    _botShoots [userHandler.Id] = new string [0];
                }

                List<List<string>> botShipsToRemove = new List<List<string>>();

                // Comprueba el disparo dentro de los barcos del bot
                foreach (var ship in botShips)
                {
                    foreach (var pos in ship)
                    {
                        if (pos == receivedUser.Identifier)
                        {
                            yourImpacted = true;
                            ship.Remove(pos);

                            if (ship.Count == 0)
                            {
                                botShipsToRemove.Add(ship); // Marcar barco para eliminarlo
                            }
                            break;
                        }
                    }
                }

                // Eliminar barcos vacíos después del bucle
                foreach (var ship in botShipsToRemove)
                {
                    botShips.Remove(ship);
                }

                // Verificar si ganaste
                if (botShips.Count == 0)
                {
                    youWin = true;
                }

                // Guarda los cambios
                _botShips [userHandler.Id] = botShips.Select(ship => ship.ToArray()).ToArray();


                string botAtack;
                int row;
                int colum;
                do
                {
                    row = random.Next(10);
                    colum = random.Next(10);
                    botAtack = chars[row]+(colum+1);
                }
                while (_botShoots[userHandler.Id].Contains(botAtack));

                _botShoots[userHandler.Id] = _botShoots[userHandler.Id].Append(botAtack).ToArray();

                List<List<string>> shipsToRemove = new List<List<string>>();

                // Comprueba si el bot impacta un barco del usuario
                foreach (var ship in Ships)
                {
                    foreach (var pos in ship)
                    {
                        if (pos == botAtack)
                        {
                            botImpacted = true;
                            ship.Remove(pos);

                            if (ship.Count == 0)
                            {
                                shipsToRemove.Add(ship); // Marcar barco para eliminarlo
                            }
                            break;
                        }
                    }
                }

                // Eliminar barcos vacíos después del bucle
                foreach (var ship in shipsToRemove)
                {
                    Ships.Remove(ship);
                }

                // Verificar si el bot gana
                if (Ships.Count == 0)
                {
                    botWin = true;
                }

                // Guarda los cambios
                _ships [userHandler.Id] = Ships.Select(ship => ship.ToArray()).ToArray();

                if (youWin)
                {
                    StopGameTimer(userHandler.Id);
                    _botShoots.Remove(userHandler.Id);

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                        var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                        User user = await _wsHelper.GetUserById(userHandler.Id);

                        int partidausuario = _partidasbot.FirstOrDefault(p => p.Player1.Id == user.Id).GameId;
                        TimeSpan timeSpan = DateTime.Now - _startedTime [partidausuario];
                        double timeFinished = timeSpan.TotalSeconds;
                        Game game = await _gameService.GetGameById(partidausuario);
                        game.Time = timeFinished;
                        _startedTime.Remove(partidausuario);

                        GameInfo gameInfo = new GameInfo();
                        gameInfo.GameId = partidausuario;
                        gameInfo.State = "Victoria";
                        gameInfo.Score = 60;
                        gameInfo.UserId = user.Id;
                        await _gameService.createGameInfo(gameInfo);
                        user.gameInfos.Add(gameInfo);
                        await _wsHelper.UpdateUserAsync(user);

                        game.gameInfos.Add(gameInfo);
                        await _gameService.UpdateGameAsync(game);

                        foreach (var friend in user.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage3 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage3, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                    }
                    int cont = 0;
                    foreach (var ship in _ships [userHandler.Id])
                    {
                        cont += ship.Length;
                    }
                    int botScore = 60 - (cont * 5);

                    FinishGameMessageDto outMessage2 = new FinishGameMessageDto
                    {
                        Message = "Has ganado al bot",
                        YourScore = 60,
                        OpponentScore = botScore,
                        Position = receivedUser.Identifier
                    };
                    string messageToSend = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                    tasks.Add(userHandler.SendAsync(messageToSend));

                    await _Semaphorepalyerbotdesconnect.WaitAsync();
                    var partida = _partidasbot.FirstOrDefault(h => h.Player1.Id==userHandler.Id);
                    _partidasbot.Remove(partida);
                    _Semaphorepalyerbotdesconnect.Release();
                    Partida[] partidas = _partidas.ToArray();
                    PartidaBot[] partidabot = _partidasbot.ToArray();
                    foreach (WebSocketHandler handler in handlers)
                    {
                        PlayersInGameMessage outMessage4 = new PlayersInGameMessage
                        {
                            Message = "Jugadores jugando",
                            quantitygame = partidabot.Length + partidas.Length,
                            quantityplayer = partidabot.Length + (partidas.Length * 2)
                        };
                        string messageToSend3 = JsonSerializer.Serialize(outMessage4, JsonSerializerOptions.Web);
                        tasks.Add(handler.SendAsync(messageToSend3));
                    }
                } else if (botWin) 
                {
                    StopGameTimer(userHandler.Id);
                    _botShoots.Remove(userHandler.Id);
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                        var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();
                        User user = await _wsHelper.GetUserById(userHandler.Id);

                        int partidausuario = _partidasbot.FirstOrDefault(p => p.Player1.Id == user.Id).GameId;
                        TimeSpan timeSpan = DateTime.Now - _startedTime [partidausuario];
                        double timeFinished = timeSpan.TotalSeconds;
                        Game game = await _gameService.GetGameById(partidausuario);
                        game.Time = timeFinished;
                        _startedTime.Remove(partidausuario);

                        GameInfo gameInfo = new GameInfo();
                        gameInfo.GameId = partidausuario;
                        gameInfo.State = "Derrota";
                        int cont2 = 0;
                        foreach (var ship in _botShips [user.Id])
                        {
                            cont2 += ship.Length;
                        }
                        int score2 = 60 - (cont2 * 5);
                        gameInfo.Score = score2;
                        gameInfo.UserId = user.Id;
                        await _gameService.createGameInfo(gameInfo);
                        user.gameInfos.Add(gameInfo);
                        await _wsHelper.UpdateUserAsync(user);

                        game.gameInfos.Add(gameInfo);
                        await _gameService.UpdateGameAsync(game);

                        foreach (var friend in user.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage4 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage4, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                    }
                    int cont = 0;
                    foreach (var ship in _botShips [userHandler.Id])
                    {
                        cont += ship.Length;
                    }
                    int score = 60 - (cont * 5);
                    FinishGameMessageDto outMessage3 = new FinishGameMessageDto
                    {
                        Message = "Te gano el bot",
                        YourScore = score,
                        OpponentScore = 60
                    };
                    string messageToSend = JsonSerializer.Serialize(outMessage3, JsonSerializerOptions.Web);
                    tasks.Add(userHandler.SendAsync(messageToSend));
                    await _Semaphorepalyerbotdesconnect.WaitAsync();
                    var partida = _partidasbot.FirstOrDefault(h => h.Player1.Id == userHandler.Id);
                    _partidasbot.Remove(partida);
                    _Semaphorepalyerbotdesconnect.Release();
                    Partida[] partidas = _partidas.ToArray();
                    PartidaBot[] partidabot = _partidasbot.ToArray();
                    foreach (WebSocketHandler handler in handlers)
                    {
                        PlayersInGameMessage outMessage5 = new PlayersInGameMessage
                        {
                            Message = "Jugadores jugando",
                            quantitygame = partidabot.Length + partidas.Length,
                            quantityplayer = partidabot.Length + (partidas.Length * 2)
                        };
                        string messageToSend3 = JsonSerializer.Serialize(outMessage5, JsonSerializerOptions.Web);
                        tasks.Add(handler.SendAsync(messageToSend3));
                    }
                } else
                {
                    BotResponseDto outMessage = new BotResponseDto
                    {
                        Message = "Respuesta del bot",
                        YourImpacted = yourImpacted,
                        YourShoot = receivedUser.Identifier,
                        BotImpacted = botImpacted,
                        BotAtack = botAtack
                    };
                    string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                    tasks.Add(userHandler.SendAsync(messageToSend));
                    StartGameTimer(userHandler.Id, userHandler);
                }
            }

            if(receivedUser.TypeMessage.Equals("Solicitud cambio de nombre"))
            {
                string newNickName = receivedUser.Identifier;
                using(var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User existingUser = await _wsHelper.GetIfExistUserByNickName(newNickName);
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    if (existingUser == null && !newNickName.Contains("@")) {
                        string oldNickName = user.NickName;
                        user.NickName = newNickName;
                        await _wsHelper.UpdateUserAsync(user);
                        DeleteDto outMessage = new DeleteDto
                        {
                            Message = "Cambiado el nombre con exito",
                            NickName = newNickName
                        };
                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                        tasks.Add(userHandler.SendAsync(messageToSend));
                        foreach (var friend in user.friends)
                        {
                            foreach (var handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    InfoToFriendsDto outMessage2 = new InfoToFriendsDto
                                    {
                                        Message="Tu amigo se cambio el nombre",
                                        OldNickName=oldNickName,
                                        NewNickName=newNickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                    } else
                    {
                        WebsocketMessageDto outMessage = new WebsocketMessageDto
                        {
                            Message = "No te puedes poner ese nombre"
                        };
                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                        tasks.Add(userHandler.SendAsync(messageToSend));
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("Solicitud cambio de email"))
            {
                string newEmail = receivedUser.Identifier;
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User existingUser = await _wsHelper.GetIfExistUserByEmail(newEmail);
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    bool isEmail = Regex.IsMatch(newEmail, "^[a-z0-9.]+@[a-z0-9]+\\.[a-z]+(\\.[a-z]+)?$", RegexOptions.IgnoreCase);
                    if (existingUser == null && isEmail) {
                        string oldEmail = user.Email;
                        user.Email = newEmail;
                        await _wsHelper.UpdateUserAsync(user);
                        DeleteDto outMessage = new DeleteDto
                        {
                            Message = "Cambiado el email con exito",
                            NickName = newEmail
                        };
                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                        tasks.Add(userHandler.SendAsync(messageToSend));
                    } else
                    {
                        WebsocketMessageDto outMessage = new WebsocketMessageDto
                        {
                            Message = "No te puedes poner ese email"
                        };
                        string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                        tasks.Add(userHandler.SendAsync(messageToSend));
                    }
                }
            }

            if (receivedUser.TypeMessage.Equals("No quiere revancha"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Tu oponente rechazo la revancha"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                        foreach (var friend in user.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                        foreach (var friend in user2.friends)
                        {
                            foreach (WebSocketHandler handler in handlers)
                            {
                                if (handler.Id == friend.FriendId)
                                {
                                    DeleteDto outMessage2 = new DeleteDto
                                    {
                                        Message = "Tu amigo dejo de jugar",
                                        NickName = user2.NickName
                                    };
                                    string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                    tasks.Add(handler.SendAsync(messageToSend2));
                                }
                            }
                        }
                        user.Status = "Conectado";
                        user2.Status = "Conectado";
                        await _wsHelper.UpdateUserAsync(user);
                        await _wsHelper.UpdateUserAsync(user2);
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("Quiere revancha primero"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Tu oponente quiere revancha"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("Acepta la revancha"))
            {
                string userName = receivedUser.Identifier;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    User user2 = await _wsHelper.GetUserByNickname(userName);
                    if (user2 != null)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == user2.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message = "Tu oponente aceptó la revancha"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                }
            }

            if(receivedUser.TypeMessage.Equals("ir a revancha"))
            {
                string userName = receivedUser.Identifier;
                List<WebSocketHandler> jugadores = new List<WebSocketHandler>();

                DeleteDto outMessage = new DeleteDto
                {
                    Message = "Ir a revancha con opotente anterior",
                    NickName = userName
                };
                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                tasks.Add(userHandler.SendAsync(messageToSend));

                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();
                    var _gameService = scope.ServiceProvider.GetRequiredService<GameService>();

                    User userOpponent = await _wsHelper.GetUserByNickname(userName);

                    foreach (var handler in handlers)
                    {
                        if(handler.Id == userHandler.Id)
                        {
                            jugadores.Add(handler);
                        }
                        if(handler.Id == userOpponent.Id)
                        {
                            jugadores.Add(handler);
                        }
                    }

                    StartGameTimer(jugadores [0].Id, jugadores [0]);
                    Game game = await _gameService.CreateGame(0);
                    Partida nuevaPartida = new Partida(game.Id, jugadores [0], jugadores[1]);
                    await _semaphoreplayerdisconnect.WaitAsync();
                    _partidas.Add(nuevaPartida);
                    _startedTime [game.Id] = DateTime.Now;
                    _semaphoreplayerdisconnect.Release();
                }
            }

            if(receivedUser.TypeMessage.Equals("termino la parida contra bot"))
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();

                    User user = await _wsHelper.GetUserById(userHandler.Id);

                    foreach (var friend in user.friends)
                    {
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == friend.FriendId)
                            {
                                DeleteDto outMessage2 = new DeleteDto
                                {
                                    Message = "Tu amigo dejo de jugar",
                                    NickName = user.NickName
                                };
                                string messageToSend2 = JsonSerializer.Serialize(outMessage2, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend2));
                            }
                        }
                    }
                    user.Status = "Conectado";
                    await _wsHelper.UpdateUserAsync(user);
                }
            }
            if(receivedUser.TypeMessage.Equals("Baneando jugador"))
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var _wsHelper = scope.ServiceProvider.GetRequiredService<WSHelper>();

                    User user = await _wsHelper.GetUserById(userHandler.Id);
                    
                    if (user.Role.Equals("Admin"))
                    {
                        User userban = await _wsHelper.GetUserById(int.Parse(receivedUser.Identifier));
                        userban.Ban = "Si";
                        await _wsHelper.UpdateUserAsync(userban);
                        foreach (WebSocketHandler handler in handlers)
                        {
                            if (handler.Id == userban.Id)
                            {
                                WebsocketMessageDto outMessage = new WebsocketMessageDto
                                {
                                    Message="Has sido baneado"
                                };
                                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                                tasks.Add(handler.SendAsync(messageToSend));
                            }
                        }
                    }
                    else
                    {
                        return;
                    }
                }
            }

            await Task.WhenAll(tasks);
        }

        private void StartGameTimer(int userId, WebSocketHandler handler)
        {
            var timer = new Timer(TimeSpan.FromMinutes(2).TotalMilliseconds);
            timer.Elapsed += async (sender, e) => await OnTimerElapsed(userId, handler);
            timer.AutoReset = false;
            timer.Start();

            _timers [userId] = timer;
        }

        private async Task OnTimerElapsed(int userId, WebSocketHandler handler)
        {
            if (_timers.ContainsKey(userId))
            {
                StopGameTimer(userId);

                WebsocketMessageDto outMessage = new WebsocketMessageDto
                {
                    Message = "Se te acabo el tiempo"
                };
                string messageToSend = JsonSerializer.Serialize(outMessage, JsonSerializerOptions.Web);
                await handler.SendAsync(messageToSend);
            }
        }

        private void StopGameTimer(int userId)
        {
            if (_timers.ContainsKey(userId))
            {
                _timers [userId].Stop();
                _timers [userId].Dispose();
                _timers.Remove(userId);
            }
        }

        private string[][] GenerateBotShips()
        {
            List<string[]> ships = new List<string[]>();
            int [] sizes = [2, 3, 3, 4];

            foreach (var size in sizes)
            {
                string [] ship;
                do
                {
                    ship = GenerateShip(size);
                }
                while (IsOverlapping(ship,ships));

                ships.Add(ship);
            }

            return ships.ToArray();
        }

        private string [] GenerateShip(int size)
        {
            Random random = new Random();
            int boardSize = 10;
            bool isHorizontal = random.Next(2) == 0;
            int row, col;

            if (isHorizontal)
            {
                row = random.Next(boardSize);
                col = random.Next(boardSize - size + 1);
            } else
            {
                row = random.Next(boardSize - size + 1);
                col = random.Next(boardSize);
            }

            string [] ship = new string [size];
            for (int i = 0; i < size; i++)
            {
                ship [i] = isHorizontal ? $"{(char)('a' + row)}{col + i + 1}" : $"{(char)('a' + row + i)}{col + 1}";
            }

            return ship;
        }

        private bool IsOverlapping(string [] ship, List<string []> existingShips)
        {
            foreach (var existingShip in existingShips)
            {
                foreach (var pos in existingShip)
                {
                    if (Array.Exists(ship, s => s == pos))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

    }
}
