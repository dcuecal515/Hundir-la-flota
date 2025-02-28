using Server.Enums;

namespace Server.Models
{
    public class Friend
    {
        public int Id { get; set; }
        public int FriendId { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
