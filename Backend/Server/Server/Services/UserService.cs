using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Server.Mappers;
using Server.Models;
using Server.DTOs;

namespace Server.Services
{
    public class UserService
    {
        private readonly UnitOfWork _unitOfWork;
        private readonly TokenValidationParameters _tokenParameters;
        private readonly UserMapper _userMapper;
        private readonly ImageService _imageService;

        public UserService(UnitOfWork unitOfWork, IOptionsMonitor<JwtBearerOptions> jwtOptions, UserMapper userMapper, ImageService imageService)
        {
            _unitOfWork = unitOfWork;
            _tokenParameters = jwtOptions.Get(JwtBearerDefaults.AuthenticationScheme)
                .TokenValidationParameters;
            _userMapper = userMapper;
            _imageService = imageService;
        }

        public async Task<User> GetUserByIdentifierAndPassword(string identifier, string password)
        {
            User user = await _unitOfWork.UserRepository.GetByIdentifierAsync(identifier);

            if (user == null)
            {
                return null;
            }
            PasswordService passwordService = new PasswordService();
            if(passwordService.IsPasswordCorrect(user.Password, password))
            {
                return user;
            }
            else
            {
                return null;
            }
        }

        public string ObtainToken(User user)
        {
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Claims = new Dictionary<string, object>
                    {
                        { "id", user.Id },
                        { "nickName", user.NickName },
                        { ClaimTypes.Role, user.Role },
                        {"Avatar",user.Avatar }
                    },
                Expires = DateTime.UtcNow.AddYears(3),
                SigningCredentials = new SigningCredentials(
                        _tokenParameters.IssuerSigningKey,
                        SecurityAlgorithms.HmacSha256Signature
                    )
            };
            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<User> GetUserFromDbByStringId(string stringId)
        {
            return await _unitOfWork.UserRepository.GetByIdAsync(Int32.Parse(stringId));
        }

        public async Task DeleteUser(User user)
        {
            _unitOfWork.UserRepository.Delete(user);
            await _unitOfWork.SaveAsync();
        }

        public async Task UpdateUser(User user)
        {
            _unitOfWork.UserRepository.Update(user);
            await _unitOfWork.SaveAsync();
        }

        public async Task<User> InsertUserAsync(User user)
        {
            // Hace falta añadir aqui un nuevo historial
            User newUser = await _unitOfWork.UserRepository.InsertAsync(user);
            await _unitOfWork.SaveAsync();
            return newUser;
        }

        public async Task<string> RegisterUser(SignUpDto receivedUser)
        {
            User user = _userMapper.toEntity(receivedUser);
            User userexist = await _unitOfWork.UserRepository.GetIfExistUserByNickName(user.NickName.ToLower());
            if (userexist != null)
            {
                return null;
            }
            PasswordService passwordService = new PasswordService();
            user.Password = passwordService.Hash(receivedUser.Password);
            if (receivedUser.Avatar != null)
            {
                user.Avatar = "/" + await _imageService.InsertAsync(receivedUser.Avatar);
            }
            else
            {
                user.Avatar = "/images/capitan.jpg";
            }
            
            user.Role = "User";

            user.Ban = "No";

            User newUser = await InsertUserAsync(user);

            return ObtainToken(newUser);
        }
      
        public async Task<IEnumerable<User>> getAllUserByName(string name,int id)
        {
            return await _unitOfWork.UserRepository.getAllUserByName(name,id);
        }
        public async Task<IEnumerable<User>> getAllUser()
        {
            return await _unitOfWork.UserRepository.GetAllAsync();
        }
        public async Task<UserProfileDataDto> getUserByIdAsync(int id)
        {
            return await _unitOfWork.UserRepository.GetUserByIdAsync(id);
        }
        public async Task<FullUserDataDto> GetFullUserById(int id, QueryDto queryDto)
        {
            return await _unitOfWork.UserRepository.GetFullUserById(id, queryDto);
        }
        public async Task<ICollection<User>> getAllUserExceptId(int id)
        {
            return await _unitOfWork.UserRepository.getAllUserExceptId(id);
        }
        public IEnumerable<UserInformation> ToDto(IEnumerable<User> users)
        {
            return _userMapper.toUserList(users);
        }
        public async Task<User> getUserByIdOnlyAsync(int id)
        {
            return await _unitOfWork.UserRepository.GetByIdAsync(id);
        }
    }
}
