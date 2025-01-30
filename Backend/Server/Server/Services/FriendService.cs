using Server.Mappers;
using Server.DTOs;
using Server.Models;

namespace Server.Services
{
    public class FriendService
    {
        private readonly UnitOfWork _unitOfWork;
        private readonly UserMapper _userMapper;

        public FriendService(UnitOfWork unitOfWork, UserMapper userMapper)
        {
            _unitOfWork = unitOfWork;
            _userMapper = userMapper;
        }
        public async Task<User> GetAllFriend(int userid)
        {
            User user = await _unitOfWork.UserRepository.GetAllFriend(userid);
            List<User> users=new List<User>();
            foreach (var friends in user.friends) 
            {
                users.Add(await _unitOfWork.UserRepository.GetByIdAsync(friends.FriendId));
            }

        }
    }
}
