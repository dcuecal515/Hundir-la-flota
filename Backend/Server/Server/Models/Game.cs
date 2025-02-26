namespace Server.Models
{
    public class Game
    {
        public int Id { get; set; }
        public int Time { get; set; }
        public ICollection<GameInfo> gameInfos { get; set; } = new List<GameInfo>();
    }
}
