using Server.DTOs;
using Server.Models;

namespace Server.Mappers
{
    public class FriendMapper
    {
        public FriendDto toDto(User user) 
        {
            return new FriendDto
            {
                Id = user.Id,
                NickName = user.NickName,
                Avatar = user.Avatar,
                Status = user.Status
            };
        }
    }
}
