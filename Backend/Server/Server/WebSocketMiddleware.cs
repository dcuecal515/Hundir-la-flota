using Microsoft.Net.Http.Headers;
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
                /*context.Request.Headers["Authorization"]*/

                context.Request.Headers[HeaderNames.Authorization] = "Bearer " + jwt;

                ///context.Request.Headers.Authorization.["Authorization"] = "Bearer " + jwt;
            }
                await _next(context);
        }

        
    }
}
