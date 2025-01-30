using Server.Models;

namespace Server
{
    public class WSHelper
    {
        private readonly UnitOfWork _unitOfWork;

        public WSHelper(UnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<User> GetUserById(int id)
        {
            return await _unitOfWork.UserRepository.GetByIdAsync(id);
        }

        public async Task<User> GetUserByNickname(string nickname)
        {
            return await _unitOfWork.UserRepository.GetByIdentifierAsync(nickname);
        }

        public async Task<Request> GetRequestByUsersId(int user1Id, int user2Id)
        {
            return await _unitOfWork.RequestRepository.GetRequestByUsersId(user1Id, user2Id);
        }

        public async Task InsertRequestAsync(Request request)
        {
            await _unitOfWork.RequestRepository.InsertAsync(request);
            await _unitOfWork.SaveAsync();
        }

        public async Task DeleteRequestAsync(Request request)
        {
            _unitOfWork.RequestRepository.Delete(request);
            await _unitOfWork.SaveAsync();
        }

        public bool GetIfUsersAreFriends(User user1, User user2)
        {
            return _unitOfWork.FriendRepository.GetIfUsersAreFriends(user1,user2);
        }

        public async Task UpdateUserAsync(User user)
        {
            _unitOfWork.UserRepository.Update(user);
            await _unitOfWork.SaveAsync();
        }
    }
}
