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
        private readonly ImageService _imageService;

        public AuthController(UserService userService, ImageService imageService) {
            _userService = userService;
            _imageService = imageService;
        }

        [HttpPost("signup")]
        public async Task<LoginResultDto> RegisterUser([FromForm] SignUpDto signUpDto)
        {
            string token = await _userService.RegisterUser(signUpDto);
            LoginResultDto loginResultDto = new LoginResultDto { accessToken = token};
            return loginResultDto;
        }

        [HttpPost("login")]
        public async Task<ActionResult<string>> LoginUser([FromBody] LoginDto loginDto)
        {
            User user = await _userService.GetUserByIdentifierAndPassword(loginDto.Identifier, loginDto.Password);
            if (user != null)
            {
                string token = _userService.ObtainToken(user);
                return Ok(new LoginResultDto { accessToken = token });
            } else
            {
                return Unauthorized();
            }
            
        }
    }
}
