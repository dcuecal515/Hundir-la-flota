using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;
using System.Net.WebSockets;

namespace Server.Controllers
{
    [Route("socket")]
    [ApiController]
    public class WebSocketController : Controller
    {
        private readonly WebSocketService _websocketService;
        private readonly UserService _userService;

        public WebSocketController(WebSocketService websocketService,UserService userService)
        {
            _websocketService = websocketService;
            _userService = userService;
        }

        [Authorize]
        [HttpGet]
        public async Task ConnectAsync()
        {
            // Si la petición es de tipo websocket la aceptamos
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                // Aceptamos la solicitud
                WebSocket webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();

                // Manejamos la solicitud.
                Console.WriteLine("HE ENTRADO EN MI WEB SOCKET SUUUUUUUUU");
                User user = await GetCurrentUser();
                await _websocketService.HandleAsync(webSocket,user);

            }
            // En caso contrario la rechazamos
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }

            // Cuando este método finalice, se cerrará automáticamente la conexión con el websocket
        }

        private async Task<User> GetCurrentUser()
        {
            // Pilla el usuario autenticado según ASP
            System.Security.Claims.ClaimsPrincipal currentUser = this.User;
            string idString = currentUser.Claims.First().ToString().Substring(3); // 3 porque en las propiedades sale "id: X", y la X sale en la tercera posición

            // Pilla el usuario de la base de datos
            return await _userService.GetUserFromDbByStringId(idString);
        }

    }
}
