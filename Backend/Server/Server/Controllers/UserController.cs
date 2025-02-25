using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Services;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : Controller
    {
        private readonly UserService _userService;

        public UserController(UserService userService) {
            _userService = userService;
        }

        [HttpGet("{id}")]
        public async Task<UserProfileDataDto> GetUserById(int id)
        {
            UserProfileDataDto userToSend = await _userService.getUserByIdAsync(id);
            return userToSend;
        }
    }
}
