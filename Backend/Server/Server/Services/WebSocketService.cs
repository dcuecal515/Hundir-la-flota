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
using System.Text;

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

                UserDateDto userDateDto=_userMapper.toDto(user);
                byte[] bytes = Encoding.UTF8.GetBytes(userDateDto.ToString());

                CancellationToken cancellation = default;
                await webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, cancellation);

            }
        }
       
    }
}
