using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Mappers;
using Server.Models;
using Server.Services;
using System.Text;
using System.Globalization;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : Controller
    {
        private readonly UserService _userService;
        private readonly UserMapper _userMapper;
        private readonly WSHelper _wshelper;
        private readonly FriendService _friendService;

        public SearchController(UserService userService,UserMapper userMapper, WSHelper wshelper, FriendService friendService)
        {
            _userService = userService;
            _userMapper = userMapper;
            _wshelper = wshelper;
            _friendService = friendService;
        }
        [Authorize]
        [HttpGet]
        public async Task<IEnumerable<UserDateDto>> Search([FromQuery] string name)
        {
            
            string separatename = name.Normalize(NormalizationForm.FormD);

            StringBuilder newname = new StringBuilder();
            foreach (char c in separatename)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                {
                    newname.Append(c);
                }
            }

            string searchname= newname.ToString().Normalize(NormalizationForm.FormC);
            User usersesion = await GetCurrentUser();
            IEnumerable<User> users=await _userService.getAllUserByName(searchname.ToLower(),usersesion.Id);
            List<UserDateDto> result=new List<UserDateDto>();
            List<UserDateDto> resultfinal=new List<UserDateDto>();
            IEnumerable<FriendDto> friends = await _friendService.GetAllFriend(usersesion.Id);
            foreach (User user in users)
            {
                UserDateDto userDateDto = _userMapper.toDto(user);
                result.Add(userDateDto);
            }
            if (result == null)
            {
                return null;
            }
            /*En desarrollo*/
            foreach(UserDateDto userDateDto in result)
            {
                Request request = await _wshelper.GetRequestByUsersId(usersesion.Id,userDateDto.Id);
                if (request == null)
                {
                    if (friends.Count()>0)
                    {
                        foreach (FriendDto friend in friends)
                        {
                            if (friend.Id == userDateDto.Id)
                            {
                                userDateDto.Message = "si";
                                resultfinal.Add(userDateDto);
                            } else
                            {
                                userDateDto.Message = "no";
                                resultfinal.Add(userDateDto);
                            }
                        }
                    } else
                    {
                        userDateDto.Message = "no";
                        resultfinal.Add(userDateDto);
                    }
                }
                else
                {
                    userDateDto.Message = "si";
                    resultfinal.Add(userDateDto);
                }
            }
            return resultfinal;
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
