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
        public async Task<IEnumerable<UserDateDto>> GetAllFriend(int userid)
        {
            return await _unitOfWork.FriendRepository.GetAllFriend(userid);
        }
    }
}
