using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;

namespace Server.Controllers
{
    [Route("socket")]
    [ApiController]
    public class WebSocketController : Controller
    {
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
                //await HandleWebsocketAsync(webSocket);
                Console.WriteLine("HE ENTRADO EN MI WEB SOCKET SUUUUUUUUU");
            }
            // En caso contrario la rechazamos
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }

            // Cuando este método finalice, se cerrará automáticamente la conexión con el websocket
        }
    }
}
