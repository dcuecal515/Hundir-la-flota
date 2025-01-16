using Microsoft.AspNetCore.Mvc;
using Server.Services;
using Server.DTOs;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;

        public AuthController(UserService userService) {
            _userService = userService;
        }

        [HttpPost("singup")]
        public async Task<string> RegisterUser([FromBody] SignUpDto signUpDto)
        {
            return await _userService.RegisterUser(signUpDto);
        }

        [HttpPost("login")]
        public async Task<ActionResult<string>> LoginUser([FromBody] LoginDto loginDto)
        {
            User user = await _userService.GetUserByIdentifierAndPassword(loginDto.Identifier, loginDto.Password);
            if (user != null)
            {
                string token = _userService.ObtainToken(user);
                return Ok(token);
            } else
            {
                return Unauthorized();
            }
            
        }
    }
}
