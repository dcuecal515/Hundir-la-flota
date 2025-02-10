namespace Server.Models
{
    public class Game
    {
        public int Id { get; set; }
        public int OpponentId { get; set; }
        public string State { get; set; }
    }
}
