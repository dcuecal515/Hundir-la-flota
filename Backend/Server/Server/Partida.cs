namespace Server
{
    public class Partida
    {
        public int GameId { get; init; }            
        public WebSocketHandler Player1 { get; set; }  
        public WebSocketHandler Player2 { get; set; }

        public Partida(int gameId, WebSocketHandler player1, WebSocketHandler player2)
        {
            GameId = gameId;
            Player1 = player1;
            Player2 = player2;
        }
    }
}
