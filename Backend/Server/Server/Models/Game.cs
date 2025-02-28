namespace Server.Models
{
    public class Game
    {
        public int Id { get; set; }
        public double Time { get; set; }
        public ICollection<GameInfo> gameInfos { get; set; } = new List<GameInfo>();
    }
}
