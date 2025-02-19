using Server.Mappers;
using Server.DTOs;
using Server.Models;

namespace Server.Services
{
    public class FriendService
    {
        private readonly UnitOfWork _unitOfWork;
        private readonly UserMapper _userMapper;
        private readonly FriendMapper _friendMapper;

        public FriendService(UnitOfWork unitOfWork, UserMapper userMapper,FriendMapper friendMapper)
        {
            _unitOfWork = unitOfWork;
            _userMapper = userMapper;
            _friendMapper = friendMapper;
        }
        public async Task<IEnumerable<FriendDto>> GetAllFriend(int userid)
        {
            User user = await _unitOfWork.UserRepository.GetAllFriend(userid);
            List<User> users=new List<User>();
            List<FriendDto> friendDtos = new List<FriendDto>();
            foreach (var friends in user.friends) 
            {
                users.Add(await _unitOfWork.UserRepository.GetByIdAsync(friends.FriendId));
            }
            foreach (var friend in users)
            {
                FriendDto dto= _friendMapper.toDto(friend);
                friendDtos.Add(dto);
            }
            if (friendDtos != null)
            {
                return friendDtos;
            }
            return null;
        }

        public async Task DeleteFrienshipByUsers(User user1, User user2)
        {
            foreach (var friend in user1.friends)
            {
                if (friend.FriendId == user2.Id)
                {
                    _unitOfWork.FriendRepository.Delete(friend);
                }
            }
            foreach (var friend in user2.friends)
            {
                if (friend.FriendId == user1.Id)
                {
                    _unitOfWork.FriendRepository.Delete(friend);
                }
            }
            await _unitOfWork.SaveAsync();
        }
    }
}
