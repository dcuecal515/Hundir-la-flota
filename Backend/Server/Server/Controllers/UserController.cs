﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Models;
using Server.Services;
using static System.Net.Mime.MediaTypeNames;

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
        [Authorize]
        [HttpGet("{id}")]
        public async Task<UserProfileDataDto> GetUserById(int id)
        {
            UserProfileDataDto userToSend = await _userService.getUserByIdAsync(id);
            return userToSend;
        }
        [Authorize]
        [HttpPut("image")]
        public async Task<ImageSendDto> changeimage([FromForm] ImageDto imageDto)
        {
            User user = await GetCurrentUser();
            if (imageDto.Image != null)
            {
                ImageService imageService = new ImageService();
                user.Avatar = "/" + await imageService.InsertAsync(imageDto.Image);
            }
            else
            {
                user.Avatar = "/images/capitan.jpg";
            }
            await _userService.UpdateUser(user);
            return new ImageSendDto{Image = user.Avatar};
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
