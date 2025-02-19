namespace Server.DTOs
{
    public class WebsocketMessageDto
    {
        public string Message { get; set; }
        public string MessageToOpponent { get; set; } = string.Empty;
    }
}
