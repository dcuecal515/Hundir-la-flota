namespace Server.Models
{
    public class GameInfo
    {
        public int Id { get; set; }
        public string State { get; set; }
        public int Score { get; set; }
        public int GameId { get; set; }
        public Game Game { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
