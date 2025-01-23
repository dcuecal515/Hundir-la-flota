using Server.Enums;

namespace Server.Models
{
    public class Friend
    {
        public int Id { get; set; }
        public string NickName { get; set; }
        public string Avatar { get; set; }
        public UserState UserState { get; set; }
    }
}
