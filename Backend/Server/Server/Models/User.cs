using Microsoft.EntityFrameworkCore;
using Server.DTOs;
using Server.Enums;

namespace Server.Models
{
    [Index(nameof(Email), IsUnique = true)]
    [Index(nameof(NickName), IsUnique = true)]
    public class User
    {
        public int Id { get; set; }

        public string NickName { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public string Avatar { get; set; }

        public string Role { get; set; }

        public UserState Status { get; set; }

        public List<FriendDto> Friends { get; set; }

        // Necesita un historial de partidas
    }
}
