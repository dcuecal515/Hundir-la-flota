using System.Net.WebSockets;
using Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Server.DTOs;
using Server.Mappers;
using Server.Repositories;
using Server.Repositories.Base;
using Server.Services;

namespace Server.Services
{
    public class WebSocketService
    {
        public async Task HandleAsync(WebSocket webSocket,User user)
        {
            // Mientras que el websocket del cliente esté conectado
            while (webSocket.State == WebSocketState.Open)
            {
             
            }
        }
       
    }
}
