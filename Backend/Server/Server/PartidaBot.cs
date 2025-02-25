namespace Server
{
    public class PartidaBot
    {
        public int GameId { get; init; }
        public WebSocketHandler Player1 { get; set; }

        public PartidaBot(int gameId, WebSocketHandler player1)
        {
            GameId = gameId;
            Player1 = player1;
        }
    }
}
