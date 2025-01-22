using System.Net.WebSockets;

namespace Server
{
    public class WebSocketMiddleware
    {
        private readonly RequestDelegate _next;

        public WebSocketMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                var jwt = context.Request.Query ["token"].ToString ();

                if(string.IsNullOrEmpty(jwt))
                {
                    context.Response.StatusCode = 401;
                    return;
                }

                var webSocket = await context.WebSockets.AcceptWebSocketAsync();

                await HandleWebSocket(webSocket, jwt);
            } else
            {
                await _next(context);
            }
        }

        private async Task HandleWebSocket(WebSocket webSocket, string jwt)
        {
            byte[] buffer = new byte [1024*4];
            WebSocketReceiveResult result;

            do
            {
                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }while (!result.CloseStatus.HasValue);

            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }
    }
}
