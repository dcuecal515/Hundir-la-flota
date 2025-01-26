using Server.Models;
using Server.DTOs;

namespace Server.Mappers
{
    public class UserMapper
    {
        // Hace falta un userafterlogindto para quitarle la contraseña

        public User toEntity(SignUpDto userDto)
        {
            return new User
            {
                NickName = userDto.NickName,
                Email = userDto.Email
            };
        }

        public UserDateDto toDto(User user)
        {
            return new UserDateDto
            {
                Id = user.Id,
                NickName = user.NickName,
                Avatar = user.Avatar
            };
        }

    }
}
