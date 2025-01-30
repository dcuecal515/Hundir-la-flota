using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Models;
using Server.Services;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FriendController : Controller
    {
        private readonly FriendService _friendService;
        private readonly UserService _userService;

        public FriendController(FriendService friendService,UserService userService)
        {
            _friendService = friendService;
            _userService = userService;

        }
        /*[Authorize]
        [HttpGet]
        public async Task<IEnumerable<FriendDto>> GetAllFriends()
        {
            User user = await GetCurrentUser();
            await _friendService.GetAllFriend(user.Id);
            return null;

        }*/
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
