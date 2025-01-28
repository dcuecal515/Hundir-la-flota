using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.DTOs;
using Server.Mappers;

namespace Server.Services
{
    public class RequestService
    {
        private readonly UnitOfWork _unitOfWork;
        private readonly UserMapper _userMapper;

        public RequestService(UnitOfWork unitOfWork, UserMapper userMapper) {
            _unitOfWork = unitOfWork;
            _userMapper = userMapper;
        }

        public async Task<IEnumerable<UserDateDto>> GetAllRequestsAsync(int userId)
        {
            IEnumerable < Request > requests = await _unitOfWork.RequestRepository.GetAllRequestByUserId(userId);

            List<UserDateDto> requestsDtos = new List<UserDateDto>();

            if (requests != null) {
                foreach (var request in requests)
                {
                    User user = await _unitOfWork.UserRepository.GetByIdAsync(request.SenderUserId);
                    UserDateDto dto = _userMapper.toDto(user);
                    requestsDtos.Add(dto);
                }
            }

            return requestsDtos;
        }
    }
}
