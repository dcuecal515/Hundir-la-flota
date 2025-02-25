using Server.Models;

namespace Server.DTOs
{
    public class UserProfileDataDto
    {
        public string NickName { get; set; }
        public string Email { get; set; }
        public string Avatar {  get; set; }
        public ICollection<Game> GamesPlayed { get; set; } = new List<Game>();
    }
}
