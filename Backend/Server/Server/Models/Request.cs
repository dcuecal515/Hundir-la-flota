using Server.Enums;

namespace Server.Models
{
    public class Request
    {
        public int Id { get; set; }
        public int SenderUserId { get; set; }
        public int ReceivingUserId { get; set; }
    }
}
