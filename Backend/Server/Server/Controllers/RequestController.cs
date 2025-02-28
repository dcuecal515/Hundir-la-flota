using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Microsoft.AspNetCore.Authorization;
using Server.DTOs;
using Server.Services;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestController : Controller
    {
        private readonly RequestService _requestService;
        private readonly UserService _userService;

        public RequestController(RequestService requestService, UserService userService) { 
            _requestService = requestService;
            _userService = userService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IEnumerable<UserDateDto>> GetAllRequestsAsync()
        {
            User user = await GetCurrentUser();

            if(user == null)
            {
                return null;
            }
            return await _requestService.GetAllRequestsAsync(user.Id);
        }

        [Authorize]
        [HttpGet("Send")]
        public async Task<IEnumerable<UserDateDto>> GetAllRequestsSendAsync()
        {
            User user = await GetCurrentUser();

            if (user == null)
            {
                return null;
            }
            return await _requestService.GetAllRequestsSendAsync(user.Id);
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
